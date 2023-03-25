const MongoClient = require("mongodb").MongoClient;

const url = "mongodb://mongo_database:27017/social-media";

const client = new MongoClient(url, { useNewUrlParser: true });

client.connect((err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("MongoDB connected");
  }
});

module.exports = client;
