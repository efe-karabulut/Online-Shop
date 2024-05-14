const crypto = require("crypto");
const mongodb = require("mongodb");
const { nextTick } = require("process");
const ObjectId = mongodb.ObjectId;
const getDb = require("../util/connect_db").getDb;

class User {
  constructor(user_name, user_password, user_email, user_cart, user_id) {
    this._id = user_id;
    this.user_name = user_name;
    this.user_password = user_password;
    this.user_email = user_email;
    this.user_cart = user_cart;
  }
  //
  //
  //
  //
  //
  //
  static generateResetPasswordToken(userId) {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(32, (err, buffer) => {
        if (err) {
          reject(err);
        } else {
          const token = buffer.toString("hex");
          const db = getDb();
          db.collection("users")
            .updateOne(
              { _id: new ObjectId(userId) },
              {
                $set: {
                  resetToken: token,
                  resetTokenExpiration: new Date(Date.now() + 3600000),
                },
              }
            )
            .then((result) => {
              resolve(token);
            })
            .catch((err) => {
              reject(err);
            });
        }
      });
    });
  }
  //
  //
  //
  //
  //
  //
  //
  saveUser() {
    const db = getDb();
    return db
      .collection("users")
      .insertOne(this)
      .then((result) => {
        return result;
      })
      .catch((err) => {
        console.log(err);
      });
  }
  //
  //
  //
  //
  //
  //
  //
  addToCart(product) {
    if (!this.user_cart.items) {
      this.user_cart.items = [];
    }
    const cartProductIndex = this.user_cart.items.findIndex((cartProd) => {
      return cartProd.productId.toString() === product._id.toString();
    });
    let newQuantity = 1;
    const updatedCartItems = [...this.user_cart.items];
    if (cartProductIndex >= 0) {
      newQuantity = updatedCartItems[cartProductIndex].quantity + 1;
      updatedCartItems[cartProductIndex].quantity = newQuantity;
    } else {
      updatedCartItems.push({
        productId: new ObjectId(product._id),
        quantity: newQuantity,
      });
    }
    const updatedCart = { items: updatedCartItems };
    const db = getDb();
    return db
      .collection("users")
      .updateOne(
        { _id: new ObjectId(this._id) },
        { $set: { user_cart: updatedCart } }
      );
  }
  //
  //
  //
  //
  //
  //
  //
  getCart() {
    const db = getDb();
    const cartItemIds = this.user_cart.items.map((cp) => {
      return cp.productId;
    });
    return db
      .collection("products")
      .find({ _id: { $in: cartItemIds } })
      .toArray()
      .then((products) => {
        let totalPrice = 0;
        const cartProduct = products.map((products) => {
          const quantity = this.user_cart.items.find((cp) => {
            return cp.productId.toString() === products._id.toString();
          }).quantity;
          totalPrice += products.price * quantity;
          return {
            ...products,
            quantity: quantity,
          };
        });
        return {
          items: cartProduct,
          totalPrice: totalPrice.toFixed(2),
        };
      })
      .catch((err) => {
        console.log(err);
      });
  }
  //
  //
  //
  //
  //
  //
  //
  deleteCartItem(prodId) {
    const updatedCart = this.user_cart.items.filter((item) => {
      return item.productId.toString() !== prodId.toString();
    });
    const db = getDb();
    return db
      .collection("users")
      .updateOne(
        { _id: new ObjectId(this._id) },
        { $set: { user_cart: { items: updatedCart } } }
      );
  }
  //
  //
  //
  //
  //
  //
  //
  increaseCartItemByOne(productId) {
    const db = getDb();
    return db.collection("users").updateOne(
      {
        _id: new ObjectId(this._id),
        "user_cart.items.productId": new ObjectId(productId),
      },
      {
        $inc: { "user_cart.items.$.quantity": 1 },
      }
    );
  }
  //
  //
  //
  //
  //
  //
  //
  decreaseCartItemByOne(productId) {
    const cartItem = this.user_cart.items.find((cp) => {
      return cp.productId.toString() === productId.toString();
    });
    if (cartItem.quantity === 1) {
      return Promise.resolve();
    }
    const db = getDb();
    return db.collection("users").updateOne(
      {
        _id: new ObjectId(this._id),
        "user_cart.items.productId": new ObjectId(productId),
      },
      {
        $inc: { "user_cart.items.$.quantity": -1 },
      }
    );
  }
  //
  //
  //
  //
  //
  //
  //
  addOrders() {
    const db = getDb();
    return this.getCart()
      .then((product) => {
        const order = {
          products: product.items,
          user: {
            _id: new ObjectId(this._id),
            name: this.user_name,
          },
        };
        return db
          .collection("orders")
          .insertOne(order)
          .then((result) => {
            this.user_cart.items = [];
            return db
              .collection("users")
              .updateOne(
                { _id: new ObjectId(this._id) },
                { $set: { user_cart: { items: [] } } }
              );
          });
      })
      .catch((err) => {
        console.log(err);
      });
  }
  //
  //
  //
  getOrderById(orderId) {
    const db = getDb();
    return db
      .collection("orders")
      .findOne({ _id: new ObjectId(orderId) })
      .then((result) => {
        return result;
      })
      .catch((err) => {
        console.log(err);
      });
  }
  //
  //
  //
  //
  getOrders() {
    const db = getDb();
    return db
      .collection("orders")
      .find({ "user._id": new ObjectId(this._id) })
      .toArray()
      .then((result) => {
        return result;
      })
      .catch((err) => {
        console.log(err);
      });
  }
  //
  //
  //
  //
  //
  //
  //
  static userFindById(userId) {
    const db = getDb();
    return db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) })
      .then((user) => {
        console.log("User Found");
        return user;
      })
      .catch((err) => {
        console.log(err);
      });
  }
  //
  //
  //
  //
  //
  //
  //
  //
  static userFindByEmail(userEmail) {
    const db = getDb();
    return db
      .collection("users")
      .findOne({ user_email: userEmail })
      .then((result) => {
        return result;
      })
      .catch((err) => {
        console.log(err);
      });
  }
  //
  //
  //
  //
  //
  //
  //
  //
  static userFindByTokenAndDate(token) {
    const db = getDb();
    return db
      .collection("users")
      .findOne({
        resetToken: token,
        resetTokenExpiration: { $gt: new Date(Date.now()) },
      })
      .then((user) => {
        return user;
      })
      .catch((err) => {
        console.log(err);
      });
  }
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  static userFindByIdAndToken(token, userId) {
    const db = getDb();
    return db
      .collection("users")
      .findOne({
        resetToken: token,
        resetTokenExpiration: { $gt: new Date(Date.now()) },
        _id: new ObjectId(userId),
      })
      .then((user) => {
        return user;
      })
      .catch((err) => {
        console.log(err);
      });
  }
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  static userUpdateNewPassword(userId, changedPassword) {
    const db = getDb();
    return db
      .collection("users")
      .updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: { user_password: changedPassword },
          $unset: { resetToken: "", resetTokenExpiration: "" },
        }
      )
      .then((result) => {
        return result;
      })
      .catch((err) => {
        console.log(err);
      });
  }
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
}

module.exports = User;
