const redisClient = require("redis");

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
};

connectToRedis()

module.exports = redis