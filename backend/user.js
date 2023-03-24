const path = require('path')
const db = require(path.resolve(__dirname, './dbconnect')).db()
const express = require('express')
const app = express()
app.use(express.json())
const http = require('http')
const server = http.createServer(app)

const usersDb = db.collection('users')

server.listen(5000, () => {
    console.log("Server is live on port 5000")
})


app.post('/users/new_user', async (req, res) => {
    // create a user
    const {username, password} = req.body

    const userExists = await usersDb.findOne({"username": username})
    if (userExists) {
        res.status(400).json({error: "Username is taken"})
    } else {
        usersDb.insertOne({'username': username, 'password': password})
        res.sendStatus(200)
    }
})


app.delete('/users/delete_user', async (req, res) => {
    // delete a user
    const {username, password} = req.body

    const userExists = await usersDb.findOne({"username": username})
    if (userExists && userExists.password === password) {
        // compare passwords
        await usersDb.deleteOne({"username": username})
        res.sendStatus(200)
    }
    else {
        res.status(400).json({error: "User does not exist or password is incorrect"})
    }
})

