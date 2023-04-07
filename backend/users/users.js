const path = require("path");
const db = require(path.resolve(__dirname, "./dbconnect")).db();
const express = require("express");
const app = express();
app.use(express.json());
const http = require("http");
const server = http.createServer(app);
const redis = require("redis");
const usersDb = db.collection("users");

const redisClient = redis.createClient({
  legacyMode: true,
  socket: {
    host: "redis_client",
    port: 6379,
  },
});

server.listen(5000, async () => {
  await redisClient.connect();
  console.log("Server is live on port 5000");
});

/*
  User Schema:
  {
    username: "",
    password: "",
    email: '',
    dob: '',
    friends: [],
    likesReceived: 0,
    likesGiven: 0,
    totalComments: 0,
    posts: []
  }
*/
const getTimestamp = () => {
  const now = new Date();
  return now.toISOString();
};

app.post("/users/new_user", async (req, res) => {
  // create a user
  const { username, password, email, dob } = req.body;
  console.log(req.body);
  const userExists = await usersDb.findOne({ username: username });
  if (userExists) {
    res.status(400).json({ error: "Username is taken" });
  } else {
    usersDb.insertOne({
      username: username,
      password: password,
      email: email,
      friends: [],
      dob: dob,
      totalPosts: 0,
      totalComments: 0,
      likesGiven: 0,
      likesReceived: 0,
      posts: [],
    });
    res.sendStatus(200);
  }
});

app.delete("/users/delete_user", async (req, res) => {
  // delete a user
  const { username } = req.body;

  const userExists = await usersDb.findOne({ username: username });
  if (userExists) {
    // compare passwords
    await usersDb.deleteOne({ username: username });
    res.sendStatus(200);
  } else {
    res
      .status(400)
      .json({ error: "User does not exist or password is incorrect" });
  }
});

app.get("/users/notifications/:username", async (req, res) => {
  const { username } = req.params;

  redisClient.lrange(
    `notifications.${username}`,
    0,
    -1,
    async (err, notifications) => {
      if (err) {
        console.log("redis err", err);
        res.sendStatus(400);
        return;
      }
      if (notifications.length > 0) {
        // clear the notifications cache for this user
        redisClient.del(`notifications.${username}`);
        res.status(200).json({ notifications: notifications });
      } else {
        res.status(200).json({ message: "You're already up to date!" });
      }
    }
  );
});

app.post("/users/add_friend", async (req, res) => {
  const { username, friendUsername } = req.body;
  const me = await usersDb.findOne({ username: username });
  const friend = await usersDb.findOne({ username: friendUsername });

  if (!me || !friend) {
    res
      .status(400)
      .json({ error: "Cannot find your account or friend to add" });
    return;
  }
  const alreadyFriends = await usersDb.findOne({
    username: username,
    friends: { $elemMatch: { username: friendUsername } },
  });
  if (alreadyFriends) {
    res.status(200).json({ message: "You are already friends" });
    return;
  }

  const message = `${username} added you as a friend! - ${getTimestamp()}`;
  await redisClient.rpush(`notifications.${friendUsername}`, message);

  const addFriend1 = await usersDb.updateOne(
    { username: username },
    { $push: { friends: { username: friendUsername } } }
  );

  const addFriend2 = await usersDb.updateOne(
    { username: friendUsername },
    { $push: { friends: { username: username } } }
  );
  res.status(200).json({ message: "Added friend" });
});

app.post("/users/report", async (req, res) => {
  const { username } = req.body;

  // get notifications for report
  let userNotifications;
  redisClient.lrange(
    `notifications.${username}`,
    0,
    -1,
    async (err, notifications) => {
      if (err) {
        console.log("redis err", err);
        res.sendStatus(400);
        return;
      }
      if (notifications.length > 0) {
        // clear the notifications cache for this user
        redisClient.del(`notifications.${username}`);
        userNotifications = notifications;
        // res.status(200).json({ notifications: notifications });
      } else {
        userNotifications = [];
        // res.status(200).json({ message: "You're already up to date!" });
      }
    }
  );

  const user = await usersDb.findOne({ username: username });
  if (user) {
    const reportInfo = {
      Username: username,
      "Total Posts": user.totalPosts,
      "Total Comments": user.totalComments,
      "Likes Given": user.likesGiven,
      "Likes Received": user.likesReceived,
      Friends: user.friends,
      Notifications: userNotifications,
    };
    res.status(200).json(reportInfo);
  } else {
    res.status(400).json({ error: "User not found" });
  }
});

app.get("/users/clear", async (req, res) => {
  await usersDb.deleteMany({});
  res.status(200).json({ message: "Cleared DB" });
});
