const path = require("path");
const db = require(path.resolve(__dirname, "./dbconnect")).db();
const express = require("express");
const app = express();
app.use(express.json());
const http = require("http");
const server = http.createServer(app);

const usersDb = db.collection("users");

server.listen(5000, () => {
  console.log("Server is live on port 5000");
});

const getTimestamp = () => {
  const now = new Date()
  return now.toISOString()
};


app.get("/posts/posts", async(req, res) => {
  // gets all posts and returns them sorted by date

  const allPosts = await usersDb.find({posts: {$ne: []}}, {projection: {password: 0}}).toArray()
  const allPostsFiltered = []
  for (let i =0; i <allPosts.length; i++){
    console.log(allPosts[i].posts.length)
    for (let j = 0; j < allPosts[i].posts.length; j++) {
      const post = allPosts[i].posts[j]
      post.author = allPosts[i].username
      allPostsFiltered.push(post)
    }
  }

  const allPostsFilteredSorted = allPostsFiltered.sort((post1, post2) => {
    return new Date(post2.timestamp) - new Date(post1.timestamp);
  })
  res.status(200).json({"posts": allPostsFiltered})
})

app.put("/posts/new_post", async (req, res) => {
  // create a post
  const { username, postId, postTitle, postContent } = req.body;

  const newPost = {
    postId: postId,
    postTitle: postTitle,
    postContent: postContent,
    timestamp: getTimestamp(),
    likes: 0,
    comments: [],
  };
  const post = await usersDb.updateOne(
    { username: username },
    { $inc: { totalPosts: 1 }, $push: { posts: newPost } }
  );

  res.sendStatus(200);
});

app.put("/posts/edit_post", async (req, res) => {
  const { username, password, postId, newContent } = req.body;
  const userExists = await usersDb.findOne({ username: username });
  if (userExists && userExists.password === password) {
    const edited = await usersDb.updateOne(
      { username: username, posts: { $elemMatch: { postId: postId } } },
      {
        $set: {
          "posts.$.postContent": newContent,
          "posts.$.editTime": getTimestamp(),
        },
      }
    );

    if (edited.modifiedCount === 0) {
      res.status(400).json({ error: "Error updating comment" });
    } else {
      res.sendStatus(200);
    }
  } else {
    res
      .status(400)
      .json({ error: "User does not exist or password is incorrect" });
  }
});

app.delete("/posts/delete_post", async (req, res) => {
  const { username, password, postId } = req.body;

  const userExists = await usersDb.findOne({ username: username });
  if (userExists && userExists.password === password) {
    // compare passwords
    const deleted = await usersDb.updateOne(
      { username: username },
      {
        $inc: { totalPosts: -1 },
        $pull: {
          posts: {
            postId: postId,
          },
        },
      }
    );

    if (deleted.modifiedCount == 0) {
      res.status(400).json({ error: "Error deleting comment" });
    } else {
      res.sendStatus(200);
    }
  } else {
    res
      .status(400)
      .json({ error: "User does not exist or password is incorrect" });
  }
});

app.put("/posts/like_post", async (req, res) => {
  // like a post
  const { author, postId, likerUsername, likerPassword } = req.body;

  const likerExists = await usersDb.findOne({ username: likerUsername });
  if (likerExists && likerExists.password === likerPassword) {
    await usersDb.updateOne(
      { username: likerUsername },
      { $inc: { likesGiven: 1 } }
    );
  } else {
    res.status(400).json({ error: "Liker doesnt exist or password incorrect" });
    return;
  }

  const liked = await usersDb.updateOne(
    {
      // query
      username: author,
      posts: {
        $elemMatch: {
          postId: postId,
        },
      },
    },
    {
      // increment likes
      $inc: {
        likesReceived: 1,
        "posts.$.likes": 1,
      },
    }
  );

  if (liked.matchedCount == 0 || liked.modifiedCount == 0) {
    res.status(400).json({ error: "No post found" });
  } else {
    res.sendStatus(200);
  }
});
