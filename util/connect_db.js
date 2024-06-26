
const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;

let _db;

const mongoConnect = (callback) => {
  MongoClient.connect("mongodb+srv://EfeKarabulut:ATovMdlwrgPsS8FC@ourshop.ujrgiwb.mongodb.net/ourShop?retryWrites=true&w=majority&appName=OurShop")
    .then((client) => {
      console.log("Connected to DB");
      _db = client.db("ourShop")
      callback();
    })
    .catch((err) => {
      console.log(err);
      throw err
    });
};

const getDb = () => {
  if (_db) {
    return _db
  }
  throw 'No database found!'
}

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;