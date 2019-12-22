require('./db/mongoose') //in that way just ensures /mongoose module runs
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const express = require('express')
const app = express()

app.use(express.json())
app.use(userRouter)
app.use(taskRouter)

module.exports = app