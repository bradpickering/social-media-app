const path = require("path");
const express = require("express");
const app = express();
app.use(express.json());
const http = require("http");
// const redisClient = require("./redisconnect");
const redis = require("redis");
const server = http.createServer(app);

// const redisClient = redis.createClient();

const subscriber = redis.createClient({
  socket: {
    host: "redis_client",
    port: 6379,
  },
});

const publisher = redis.createClient({
  socket: {
    host: "redis_client",
    port: 6379,
  },
});

server.listen(5000, async () => {
  await publisher.connect();
  await subscriber.connect();
  console.log("Server is live on port 5001");
});

app.get("/message", async (req, res) => {
  console.log("HERE");
  // keep the connection alive

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Transfer-Encoding": "chunked",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  await subscriber.subscribe("chat", (message) => {
    res.write("hi\n");
    // res.end();
    // res.flush();
    console.log(message);
  });

  //   redisSub.on("message", (channel, message) => {
  //     console.log(channel, "CHANNEL");
  //     res.write(`data: ${message}\n\n`);
  //     res.flush();
  //   });

  req.on("close", () => {
    subscriber.unsubscribe("chat");
    res.end();
  });
});

app.post("/message/send", async (req, res) => {
  const { message, username } = req.body;

  const message2 = {
    id: "123",
    message: "abcdef",
  };
  await publisher.publish("chat", message, username);

  res.send("message sent");
});
