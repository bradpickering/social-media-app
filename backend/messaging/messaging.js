const path = require("path");
const express = require("express");
const app = express();
app.use(express.json());
const http = require("http");
const server = http.createServer(app);
const redisClient = require('redis')


// redis init
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

server.listen(5000, async() => {
  console.log("Server is live on port 5000");
});


const getTimestamp = () => {
  const now = new Date();
  return now.toISOString();
};


app.post("/messages/get", async(req, res) => {
  const {sender, recipient} = req.body
  redis.lrange(`messages.${sender}.to.${recipient}`, 0, -1, async(err, messages) => {
    if (err) {
      console.log("redis err", err)
      res.sendStatus(400)
      return
    }
    res.status(200).json({messages: messages})
  })
})


app.post("/messages/send", async(req, res) => {
  const {sender, recipient, message} = req.body
  const msg = `${message} - ${getTimestamp()}`
  console.log("message", msg, message)
  redis.rpush(`messages.${sender}.to.${recipient}`, msg)
  res.send(200)
})

