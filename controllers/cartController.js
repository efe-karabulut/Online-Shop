const Product = require("../models/product");
const fs = require("fs");
const path = require("path");
const rootDir = require("../util/mainRoot");
const PDFDocument = require("pdfkit");

exports.getCartPage = (req, res, next) => {
  req.user
    .getCart()
    .then((product) => {
      res.render("cart/cart", {
        path: "myProducts-layout",
        pageTitle: "My Cart",
        prods: product,
      });
    })

    .catch((err) => {
      const error = new Error(
        "Cart nesnesindeki ürünler aranırken DB'de hata meydana geldi. From: getCartPage()"
      );
      error.status = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  req.user
    .getOrders()
    .then((orders) => {
      res.render("cart/orders", {
        path: "orders-layout",
        pageTitle: "My Orders",
        order: orders,
      });
    })
    .catch((err) => {
      const error = new Error(
        "Geçmiş Siparişler aranırken DB'de hata meydana geldi. From: getOrders()"
      );
      error.status = 500;
      return next(error);
    });
};

exports.postCartProduct = (req, res, next) => {
  console.log("req user: ", req.user);
  const productId = req.body.productId;
  Product.findById(productId).then((product) => {
    return req.user
      .addToCart(product)
      .then((result) => {
        console.log("ürün eklendi");
        res.redirect("/my-cart");
      })
      .catch((err) => {
        const error = new Error(
          "Siparişler Cart'a eklenirken DB'de hata meydana geldi. From: postCartProduct()"
        );
        error.status = 500;
        return next(error);
      });
  });
};

exports.deleteProductFromCart = (req, res, next) => {
  const productID = req.body.productId;
  req.user
    .deleteCartItem(productID)
    .then((deletedProduct) => {
      res.redirect("/my-cart");
    })
    .catch((err) => {
      const error = new Error(
        "Cart'daki ürün silinirken DB'de hata meydana geldi. From: deleteProductFromCart()"
      );
      error.status = 500;
      return next(error);
    });
};

exports.postIncreaseProduct = (req, res, next) => {
  const productId = req.body.productId;
  req.user
    .increaseCartItemByOne(productId)
    .then((result) => {
      res.redirect("/my-cart");
    })
    .catch((err) => {
      const error = new Error(
        "Cart sayfasında ürünün miktarını bir arttırırken DB'de hata meydana geldi. From: postIncreaseProduct()"
      );
      error.status = 500;
      return next(error);
    });
};

exports.postDecreaseProduct = (req, res, next) => {
  const productId = req.body.productId;

  req.user
    .decreaseCartItemByOne(productId)
    .then((result) => {
      res.redirect("/my-cart");
      console.log("result", result);
    })
    .catch((err) => {
      const error = new Error(
        "Cart sayfasında ürünün miktarını bir azaltırken DB'de hata meydana geldi. From: postDecreaseProduct()"
      );
      error.status = 500;
      return next(error);
    });
};

exports.postOrderProduct = (req, res, next) => {
  req.user
    .addOrders()
    .then((result) => {
      res.redirect("/my-cart");
    })
    .catch((err) => {
      const error = new Error(
        "Sipariş verirken DB'de hata meydana geldi. From: postOrderProduct()"
      );
      error.status = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  req.user
    .getOrderById(orderId)
    .then((order) => {
      if (!order) {
        const error = new Error("Order not found!");
        error.status = 500;
        return next(error);
      }
      if (order.user._id.toString() !== req.user._id.toString()) {
        const error = new Error("Unauthorized!");
        error.status = 500;
        return next(error);
      }
      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join(rootDir, "data", "invoices", invoiceName);
      const PDFDoc = new PDFDocument();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'inline; filename="' + invoiceName + '"'
      );
      PDFDoc.pipe(fs.createWriteStream(invoicePath));
      PDFDoc.pipe(res);

      PDFDoc.fontSize(24).text("Invoice", {
        underline: true,
      });
      PDFDoc.text("------------------------");
      let totalPrice = 0;
      order.products.forEach((prod) => {
        totalPrice += prod.price * prod.quantity;
        PDFDoc.fontSize(14).text(`Name: ${prod.title}`);

        PDFDoc.fontSize(14).text(`Price: ${prod.price}`);
        
        PDFDoc.fontSize(14).text(`Quantity: ${prod.quantity}`);
      });
      PDFDoc.fontSize(14).text(`Total Price: ${totalPrice.toFixed(2)}`);
      PDFDoc.end();
    })
    .catch((err) => {
      const error = new Error("DB error. From: getOrderById() ");
      error.status = 500;
      return next(error);
    });
};
