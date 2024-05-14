exports.get404ErrorPage = (req, res, next) => {
  res.status(404).render("error/404", {
    pageTitle: "NotFound",
    path: "",
  });
};

exports.get500ErrorPage = (req, res, next) => {
  res.status(500).render("error/500", {
    pageTitle: "Some Error",
    path: "",
  });
};
