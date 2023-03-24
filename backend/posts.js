const path = require('path')
const db = require(path.resolve(__dirname, './dbconnect')).db()
const express = require('express')
const app = express()
app.use(express.json())
const http = require('http')
const server = http.createServer(app)

const usersDb = db.collection('users')

server.listen(5001, () => {
    console.log('Server is live on port 5001')
})


const getTimestamp = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const currentDate = `${year}-${month}-${day}-${minute}`;

    return currentDate
}


app.put('/posts/new_post', async (req, res) => {
    // create a post
    const {username, postId, postTitle, postContent} = req.body

    const currentDate = getTimestamp()

    const newPost = {
        'postId': postId,
        'postTitle': postTitle,
        'postContent': postContent,
        'timestamp': currentDate,
        'likes': 0,
        'comments': []
    }
    const post = await usersDb.updateOne({'username': username}, {'$push': {'posts': newPost}})

    res.sendStatus(200)
})


app.put('/posts/like_post', async (req, res) => {
    // like a post
    const {author, postId} = req.body

    const liked = await usersDb.updateOne({
        // query
        'username': author, 
        'posts': {
            '$elemMatch': {
                'postId': postId
            }
        }
    }, {
        // increment likes
        '$inc': {
            'posts.$.likes': 1
        }
    })

    res.sendStatus(200)
})

app.put('/posts/like_post', async (req, res) => {
    // like a post
    const {postAuthor, postId, commentAuthor, commentId, commentContent} = req.body

    // timestamp
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const currentDate = `${year}-${month}-${day}-${minute}`;

    const liked = await usersDb.updateOne({
        // query
        'username': author, 
        'posts': {
            '$elemMatch': {
                'postId': postId
            }
        }
    }, {
        // increment likes
        '$push': {
            'posts.$.comments': 1
        }
    })

    res.sendStatus(200)
})

