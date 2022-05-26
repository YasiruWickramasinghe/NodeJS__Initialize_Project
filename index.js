const express = require('express')
const app = express()
const mongoose = require('mongoose')

const apiPort = process.env.PORT || 3001

app.get('/', (req, res) => {
  res.send('NodeJS Initialize Project Running...!')
})

app.listen(apiPort, () => console.log(`Server running on port ${apiPort}`))
