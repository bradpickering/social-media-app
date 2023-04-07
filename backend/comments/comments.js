const path = require("path");
const db = require(path.resolve(__dirname, "./dbconnect")).db();
const express = require("express");
const app = express();
app.use(express.json());
const http = require("http");
const server = http.createServer(app);
const redisClient = require("redis");

const usersDb = db.collection("users");
let redis = null;
const connectToRedis = async () => {
  redis = redisClient.createClient({
    legacyMode: true,
    socket: {
      host: "redis_client",
      port: 6379,
    },
  });
  await redis.connect();

  return redis;
};

connectToRedis();

server.listen(5000, () => {
  console.log("Server is live on port 5000");
});

const getTimestamp = () => {
  const now = new Date();
  return now.toISOString();
};

app.post("/comments/new_comment", async (req, res) => {
  // comment on a post
  const { postAuthor, postId, commentAuthor, commentId, commentContent } =
    req.body;
  const commenterExists = await usersDb.findOne({ username: commentAuthor });
  if (commenterExists) {
    // send notification via redis
    const message = `${commentAuthor} commented '${commentContent}' on your post! - ${getTimestamp()}`;
    await redis.rpush(`notifications.${postAuthor}`, message);

    await usersDb.updateOne(
      { username: commentAuthor },
      { $inc: { totalComments: 1 } }
    );
  } else {
    res
      .status(400)
      .json({ error: "Commentor doesnt exist or password incorrect" });
    return;
  }

  const newComment = {
    commentId: commentId,
    author: commentAuthor,
    commentContent: commentContent,
    likes: 0,
    timestamp: getTimestamp(),
  };

  const comment = await usersDb.updateOne(
    {
      // query
      username: postAuthor,
      posts: {
        $elemMatch: {
          postId: postId,
        },
      },
    },
    {
      // increment likes
      $push: {
        "posts.$.comments": newComment,
      },
    }
  );

  res.sendStatus(200);
});

app.put("/comments/edit_comment", async (req, res) => {
  const { postAuthor, postId, commentId, newContent } = req.body;
  const edited = await usersDb.updateOne(
    {
      username: postAuthor,
      posts: {
        $elemMatch: {
          postId: postId,
          comments: {
            $elemMatch: {
              commentId: commentId,
            },
          },
        },
      },
    },
    {
      $set: {
        "posts.$[].comments.$[comment].commentContent": newContent,
        "posts.$[].comments.$[comment].editTime": getTimestamp(),
      },
    },
    {
      arrayFilters: [{ "comment.commentId": commentId }],
    }
  );

  if (edited.modifiedCount == 0) {
    res.status(400).json({ error: "Error editing comment" });
  } else {
    res.sendStatus(200);
  }
});

app.delete("/comments/delete_comment", async (req, res) => {
  const { postAuthor, postId, commentId, commentAuthor } = req.body;

  const commenterExists = await usersDb.findOne({ username: commentAuthor });
  if (commenterExists) {
    await usersDb.updateOne(
      { username: commentAuthor },
      { $inc: { totalComments: -1 } }
    );
  } else {
    res
      .status(400)
      .json({ error: "Commentor doesnt exist or password incorrect" });
    return;
  }

  const deletedComment = await usersDb.updateOne(
    {
      // query
      username: postAuthor,
      posts: {
        $elemMatch: {
          postId: postId,
          comments: {
            $elemMatch: {
              commentId: commentId,
            },
          },
        },
      },
    },
    {
      // increment likes
      $pull: {
        "posts.$[].comments": { commentId: commentId },
      },
    }
  );

  if (deletedComment.modifiedCount == 0) {
    res.status(400).json({ error: "Error deleting comment" });
  } else {
    res.sendStatus(200);
  }
});

app.put("/comments/like_comment", async (req, res) => {
  // like a comment
  const { postAuthor, postId, commentId, commentAuthor, likerUsername } =
    req.body;

  const likerExists = await usersDb.findOne({ username: likerUsername });
  if (likerExists) {
    await usersDb.updateOne(
      { username: likerUsername },
      { $inc: { likesGiven: 1 } }
    );

    await usersDb.updateOne(
      { username: commentAuthor },
      { $inc: { likesReceived: 1 } }
    );
  } else {
    res.status(400).json({ error: "Liker doesnt exist or password incorrect" });
    return;
  }
  const liked = await usersDb.updateOne(
    {
      // query
      username: postAuthor,
      posts: {
        $elemMatch: {
          postId: postId,
          comments: {
            $elemMatch: {
              commentId: commentId,
            },
          },
        },
      },
    },
    {
      // increment likes
      $inc: {
        "posts.$[post].comments.$[comment].likes": 1,
      },
    },
    {
      arrayFilters: [
        { "post.postId": postId },
        { "comment.commentId": commentId },
      ],
    }
  );

  if (liked.matchedCount == 0 || liked.modifiedCount == 0) {
    res.status(400).json({ error: "No comment found" });
  } else {
    res.sendStatus(200);
  }
});
