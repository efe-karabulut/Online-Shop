const mongodb = require("mongodb");
const ObjectId = mongodb.ObjectId;
const getDb = require("../util/connect_db").getDb;

class Product {
  constructor(title, imgUrl, price, description, userId) {
    this.title = title;
    this.imgUrl = imgUrl;
    this.price = price;
    this.description = description;
    this.userId = userId;
  }

  save() {
    const db = getDb();
    return db
      .collection("products")
      .insertOne(this)
      .then((result) => {
        return result;
      })
      .catch((err) => {
        throw new Error(err);
      });
  }

  static fetchAll(page, perPage) {
    const db = getDb();
    return db
      .collection("products")
      .find()
      .skip((page - 1) * perPage)
      .limit(perPage)
      .toArray()
      .then((products) => {
        return products;
      })
      .catch((err) => {
        throw err;
      });
  }

  static countAllProducts() {
    const db = getDb();
    return db
      .collection("products")
      .countDocuments()
      .then((result) => {
        return result
      })
      .catch((err) => {
        throw err
      });
  }

  static getProductCreatedByUser(userId) {
    const db = getDb();
    return db
      .collection("products")
      .find({ userId: new ObjectId(userId) })
      .toArray()
      .then((result) => {
        return result;
      })
      .catch((err) => {
        console.log(err);
      });
  }

  static findById(productId) {
    const db = getDb();
    return db
      .collection("products")
      .findOne({ _id: new ObjectId(productId) })
      .then((product) => {
        console.log("Products found by findById()");
        return product;
      })
      .catch((err) => {
        throw err;
      });
  }

  static saveUpdatedProduct(productId, productObject) {
    const db = getDb();
    return db
      .collection("products")
      .updateOne({ _id: new ObjectId(productId) }, { $set: productObject })
      .then((product) => {
        console.log("Product updated by saveUpdatedProduct()");
        return product;
      })
      .catch((err) => {
        throw err;
      });
  }

  static deleteProduct(productId) {
    const db = getDb();
    return db
      .collection("products")
      .deleteOne({ _id: new ObjectId(productId) })
      .then((product) => {
        console.log("Product deleted by deleteProduct()");
        return product;
      })
      .catch((err) => {
        throw err;
      });
  }
}

module.exports = Product;
