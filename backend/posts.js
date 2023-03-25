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

    const newPost = {
        'postId': postId,
        'postTitle': postTitle,
        'postContent': postContent,
        'timestamp': getTimestamp(),
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

    if (liked.matchedCount == 0 || liked.modifiedCount == 0) {
        res.status(400).json({error: "No post found"})
    } else {
        res.sendStatus(200)
    }
})

app.put('/posts/new_comment', async (req, res) => {
    // comment on a post
    const {postAuthor, postId, commentAuthor, commentId, commentContent} = req.body

    const newComment = {
        "commentId": commentId,
        "author": commentAuthor,
        "commentContent": commentContent,
        "likes": 0,
        "timestamp": getTimestamp()
    }

    const comment = await usersDb.updateOne({
        // query
        'username': postAuthor, 
        'posts': {
            '$elemMatch': {
                'postId': postId
            }
        }
    }, {
        // increment likes
        '$push': {
            'posts.$.comments': newComment
        }
    })

    res.sendStatus(200)
})


app.put('/posts/like_comment', async (req, res) => {
    // like a comment
    const {postAuthor, postId, commentId} = req.body

    const liked = await usersDb.updateOne({
        // query
        'username': postAuthor, 
        'posts': {
            '$elemMatch': {
                'postId': postId,
                'comments': {
                    '$elemMatch': {
                        'commentId': commentId
                    }
                }
            }
        }
    }, {
        // increment likes
        '$inc': {
            'posts.$[post].comments.$[comment].likes': 1
        }
    }, {
        arrayFilters: [
            {'post.postId': postId},
            {'comment.commentId': commentId}
        ]
    })

    if (liked.matchedCount == 0 || liked.modifiedCount == 0) {
        res.status(400).json({error: "No comment found"})
    } else {
        res.sendStatus(200)
    }

})

