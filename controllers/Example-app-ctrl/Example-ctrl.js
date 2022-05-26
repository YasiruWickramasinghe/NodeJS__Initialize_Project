const Modeldata = require('../../models/Customer-model')
///jwt///
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
const dotenv = require('dotenv').config();
const crypto = require("crypto");
///end jwt///
const { OAuth2Client } = require('google-auth-library')
const client = new OAuth2Client(process.env.GOOGLECLIENT_ID)
const sendEmail = require("../../utils/sendEmail");

const emaiBody = `Welcome to Artisto and </br>        
Thanks for creating an account on Artisto. You can access your account 
area to to discovering your wonders, Auctioning, and more at: 
<a href="https://artisto.com" target="_blank">artisto.com.</a> 
We look forward to seeing you soon.
Thank You.!`;

//cutomer registraion
const InsertCustomer = (req, res) => {

    Modeldata.findOne({ email: req.body.email }, function (err, user) {
        if (err) return res.status(500).send('Error on the server.');
        if (!user) {
            var hashedPassword = bcrypt.hashSync(req.body.password, 8);
  
            Modeldata.create({
                
                username:req.body.username,
                email:req.body.email,
                password:hashedPassword,
                type:"customer",
                regDate:req.body.regDate
          },
          function (err, user) {
            if (err) return res.status(500).send("There was a problem registering the user.")
            // create a token
            var token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
              expiresIn: 86400 // expires in 24 hours
            });
            res.status(200).send({ auth: true, token: token });

           /* sendEmail(req.body.username,req.body.email, "Your Artisto account has been created!", emaiBody)
            .then(() => {              
               console.log("Email sent")          
            })
            .catch((error) => {
                console.log(error);                
            });*/

           
          });

        }else{

            return res.status(500).send("Already available user")
        }
        
        
      });

  
    
}

//Customer Login
const CustomerLogin = async (req, res) => {

   
    Modeldata.findOne({ email: new RegExp('^' + req.body.email + '$', 'i') }, function (err, user) {
        if (err) return res.status(500).send('Error on the server.');
        if (!user) return res.status(404).send('No user found.');
        
        var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
        if (!passwordIsValid) return res.status(401).send({ auth: false, token: null });
        
        var token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
          expiresIn: 86400 // expires in 24 hours
        });
        
        res.status(200).send({ auth: true, token: token, username:user.username });
      });
}

//cutomer google registration/login
const GoogleLogin = async (req, res) => {
        const { token, regDate }  = req.body
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLECLIENT_ID
        });
        const { name, email, picture } = ticket.getPayload();    
       
        await Modeldata.findOne({ email: email }, function (err, user) {
          if (err) return res.status(500).send('Error on the server.');
          if (!user) {
              var hashedPassword = bcrypt.hashSync(crypto.randomBytes(32).toString("hex"), 8);
    
              Modeldata.create({
                  
                  username:name,
                  email:email,
                  password:hashedPassword,
                  type:"customer",
                  regDate:regDate
            },
            function (err, user) {
            
              if (err) return res.status(500).send("There was a problem registering the user.")
              // create a token
              var token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
                expiresIn: 86400 // expires in 24 hours
              });

              res.status(200).send({ auth: true, token: token, username:user.username });
              
             /* sendEmail(name,email, "Your Artisto account has been created!", emaiBody)
              .then(() => {              
                 console.log("Email sent")          
              })
              .catch((error) => {
                  console.log(error);                
              });*/

              
            });
  
          }else{
             
            var token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
              expiresIn: 86400 // expires in 24 hours
            });
            res.status(200).send({ auth: true, token: token, username:user.username });
          }
          
          
        });
  
}

//get my account details
const getMyDetails = async(req,res)=>{
  
  try{
     await Modeldata.findOne({ _id:req.userId})
     .select("-_id username email")
      .then((data)=>{
          if(!data){
            res.status(200).send({ msg: "no user found" });
          }
          else{
            res.status(200).send({data});
          }
      }).catch((err)=>{
        console.log(err) 
      })
    }catch(err){
      return err;
    }

}

//update my profile data
const updateMyDetails  = async(req,res)=>{
  try{
    var username = req.body.username;
   await Modeldata.findByIdAndUpdate(req.userId,{
     username:username
    })   
    .then((data)=>{
         
        res.status(200).send({username:username});
      
      }).catch((err)=>{
        console.log(err) 
      })
  }catch(err){
    return err;
  }
 }
 const changePassword = async (req,res)=>{

  const { password , newpassword }  = req.body
  var hashedPassword = bcrypt.hashSync(newpassword, 8);

 await  Modeldata.findOne({ _id:req.userId})
  .then(async(user)=>{
     if(!user){
       res.status(200).send({ msg: "no user found" });
     }
     else{
      var passwordIsValid = bcrypt.compareSync(password, user.password);
      if (!passwordIsValid) return res.status(401).send({ msg: "old password is incorrect" });
      
      await Modeldata.findByIdAndUpdate(req.userId,{
        password:hashedPassword
       })   
       .then((data)=>{
            
         res.status(200).send({ msg:"password changed"});
         
         }).catch((err)=>{
           console.log(err) 
         })
      
     
     }
  }).catch((err)=>{
   console.log(err) 
  })
 }
 
 
module.exports = {
    
    InsertCustomer,  
    CustomerLogin,
    GoogleLogin,
    getMyDetails,
    updateMyDetails,
    changePassword
        
    
    
}