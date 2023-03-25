const path = require("path");
const db = require(path.resolve(__dirname, "./dbconnect")).db();
const express = require("express");
const app = express();
app.use(express.json());
const http = require("http");
const server = http.createServer(app);

const usersDb = db.collection("users");

server.listen(5001, () => {
  console.log("Server is live on port 5001");
});

const getTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const currentDate = `${year}-${month}-${day}-${minute}`;

  return currentDate;
};

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
    { $push: { posts: newPost } }
  );

  res.sendStatus(200);
});

app.put("/posts/edit_post", async (req, res) => {
  const { username, password, postId, newContent } = req.body;
  const userExists = await usersDb.findOne({ username: username });
  if (userExists && userExists.password === password) {
    console.log("HERE");
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
  const { author, postId } = req.body;

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
