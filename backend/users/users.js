const path = require("path");
const db = require(path.resolve(__dirname, "./dbconnect")).db();
const express = require("express");
const app = express();
app.use(express.json());
const http = require("http");
const { report } = require("process");
const server = http.createServer(app);

const usersDb = db.collection("users");

server.listen(5000, () => {
  console.log("Server is live on port 5001");
});

app.post("/users/new_user", async (req, res) => {
  // create a user
  const { username, password } = req.body;

  const userExists = await usersDb.findOne({ username: username });
  if (userExists) {
    res.status(400).json({ error: "Username is taken" });
  } else {
    usersDb.insertOne({
      username: username,
      password: password,
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
  const { username, password } = req.body;

  const userExists = await usersDb.findOne({ username: username });
  if (userExists && userExists.password === password) {
    // compare passwords
    await usersDb.deleteOne({ username: username });
    res.sendStatus(200);
  } else {
    res
      .status(400)
      .json({ error: "User does not exist or password is incorrect" });
  }
});

app.get("/users/report/:username", async (req, res) => {
  const { username } = req.params;

  const user = await usersDb.findOne({ username: username });
  if (user) {
    console.log(user);
    const reportInfo = {
      "Total Posts": user.totalPosts,
      "Total Comments": user.totalComments,
      "Likes Given": user.likesGiven,
      "Likes Received": user.likesReceived,
    };
    res.status(200).json(reportInfo);
  } else {
    res.status(400).json({ error: "User not found" });
  }
});
