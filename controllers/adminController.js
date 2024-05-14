const Product = require("../models/product");
const { validationResult } = require("express-validator");
const fileHelper = require("../util/file");
const fs = require("fs");
const { file } = require("pdfkit");

exports.getAdminPage = (req, res, next) => {
  res.render("admin/admin", {
    path: "admin-layout",
    pageTitle: "Admin",
  });
};

exports.getAdminProducts = (req, res, next) => {
  const userId = req.user._id;
  Product.getProductCreatedByUser(userId)
    .then((products) => {
      res.render("admin/admin-products", {
        prods: products,
        pageTitle: "Admin Product",
        path: "product-list-layout",
        edit: "?edit=true",
      });
    })
    .catch((err) => {
      const error = new Error(
        "Kullanıcı tarafından oluşturulan ürün aranırken DB'de hata meydana geldi. From: getAdminProducts()"
      );
      error.status = 500;
      next(error);
    });
};

exports.getAddProductPage = (req, res, next) => {
  res.render("admin/add-product", {
    pageTitle: "AddProduct",
    path: "product-layout",
    errorMsg: "",
    errorPath: [],
    product: {
      title: "",
      imgUrl: "",
      description: "",
      price: "",
    },
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const description = req.body.description;
  const priceSTR = req.body.price;
  const userId = req.user._id;
  const price = parseFloat(priceSTR);
  console.log("yüklenen image:", image);

  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.render("admin/add-product", {
      pageTitle: "AddProduct",
      path: "product-layout",
      errorMsg: error.array()[0].msg,
      errorPath: error.array(),
      product: {
        title: title,
        description: description,
        price: priceSTR,
      },
    });
  }

  if (!image) {
    return res.render("admin/add-product", {
      pageTitle: "AddProduct",
      path: "product-layout",
      errorMsg: "Attached file is not an image",
      errorPath: [],
      product: {
        title: title,
        description: description,
        price: priceSTR,
      },
    });
  }

  const imageUrl = image.path;
  const product = new Product(title, imageUrl, price, description, userId);
  product
    .save()
    .then((result) => {
      res.redirect("/admin/product-list");
    })
    .catch((err) => {
      const error = new Error(
        "Ürünü kayıt ederken DB'de hata meydana geldi. From: postAddProduct()"
      );
      error.status = 500;
      return next(error);
    });
};

exports.getEditProductPage = (req, res, next) => {
  const productID = req.params.productId;
  const editMode = req.query.edit;
  const userIdFromReqUser = req.user._id.toString();
  if (editMode !== "true") {
    return res.redirect("/admin/product-list");
  }
  Product.findById(productID)
    .then((product) => {
      if (product.userId.toString() !== userIdFromReqUser) {
        return res.redirect("/");
      }
      res.render("admin/edit-products", {
        pageTitle: "Edit Product",
        path: "",
        product: product,
        userId: product.userId,
        errorMsg: "",
        errorPath: [],
      });
    })
    .catch((err) => {
      const error = new Error(
        "Ürünü düzenleme sayfası gösterilirken DB'de hata meydana geldi. From: getEditProductPage()"
      );
      error.status = 500;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const productID = req.body.productId;
  const updatedTitle = req.body.title;
  const image = req.file;
  const updatedDescription = req.body.description;
  const updatedPriceSTR = req.body.price;
  const userIdFromForm = req.body.userId;
  const userIdFromThisUser = req.user._id.toString();
  const error = validationResult(req);

  if (userIdFromThisUser !== userIdFromForm) {
    return res.redirect("/");
  }

  if (!error.isEmpty()) {
    return res.render("admin/edit-products", {
      pageTitle: "Edit Product",
      path: "",
      product: {
        title: updatedTitle,
        price: updatedPriceSTR,
        description: updatedDescription,
      },
      userId: userIdFromForm,
      errorMsg: error.array()[0].msg,
      errorPath: error.array(),
    });
  }

  const updatedPrice = parseFloat(updatedPriceSTR);
  Product.findById(productID)
    .then((product) => {
      console.log("asdfasdfas", product.imgUrl, "haha", image);
      const updatedItem = {
        title: updatedTitle,
        imgUrl: image ? image.path : product.imgUrl,
        price: updatedPrice,
        description: updatedDescription,
      };

      Product.saveUpdatedProduct(productID, updatedItem)
        .then((result) => {
          if (image) {
            fileHelper.deleteFile(product.imgUrl);
          }
          res.redirect("/admin/product-list");
        })
        .catch((err) => {
          const error = new Error(
            "Ürünü güncellerken DB'de hata meydana geldi. From: postEditProduct()"
          );
          error.status = 500;
          return next(error);
        });
    })
    .catch((err) => {
      const error = new Error(
        "Ürünü ararken DB'de hata meydana geldi. From: postEditProduct()"
      );
      error.status = 500;
      return next(error);
    });
};

exports.postDeleteProduct = (req, res, next) => {
  const productID = req.body.productId;
  const imgUrl = req.body.imgUrl;
  Product.findById(productID)
    .then((product) => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect("/");
      }
      Product.deleteProduct(productID)
        .then((product) => {
          fileHelper.deleteFile(imgUrl);
          res.redirect("/admin/product-list");
        })
        .catch((err) => {
          const error = new Error(
            "Ürün Silinirken DB'de hata meydana geldi. From: postDeleteProduct()"
          );
          error.status = 500;
          return next(error);
        });
    })
    .catch((err) => {
      const error = new Error(
        "Silinecek ürün'ü ararken DB'de hata meydana geldi. From: postDeleteProduct()"
      );
      error.status = 500;
      return next(error);
    });
};
