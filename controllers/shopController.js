const Product = require("../models/product");
// burda modülümdeki fetchAll() fonksiyonu için bir callbak fonksiyon oluşturuyoruz.
// içerisine parametre veriyoruz bu parametre de eğer hata almazsa benim verilerime eşit oluyor eğer hata alırsa
// bu veriler boş array olarak tutuluyor.
const perPage = 1;
let totalItems;
exports.getShopPage = (req, res, next) => {
  const page = +req.query.page || 1;

  Product.countAllProducts().then((numItem) => {
    totalItems = numItem
    Product.fetchAll(page, perPage)
      .then((products) => {
        res.render("shop/shop", {
          prods: products,
          pageTitle: "Shop",
          path: "shop-layout",
          currentPage: page, // 1. sayfa da ise 1
          hasNextPage: perPage * page < totalItems, // 1. sayfa da ise True 
          hasPreviousPage: page > 1, // 1. sayfa da ise False
          nextPage: page + 1, // 1. sayfa da ise bir sonraki sayfa 2
          previousPage: page - 1, // 1. sayfa da ise bir önceki sayfa 0 
          lastPage: Math.ceil(totalItems / perPage) // 10 / 2 = 5 yani en son sayfa 5 
        });
      })
      .catch((err) => {
        const error = new Error(
          "Tüm siparişler aranırken DB'de hata meydana geldi. From: getShopPage()"
        );
        error.status = 500;
        return next(error);
      });
  });
};

exports.getProductDetail = (req, res, next) => {
  const productId = req.params.productId;
  Product.findById(productId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "",
      });
    })
    .catch((err) => {
      const error = new Error(
        "Sipariş'in detaylı sayfası aranırken DB'de hata meydana geldi. From: getProductDetail()"
      );
      error.status = 500;
      return next(error);
    });
};
