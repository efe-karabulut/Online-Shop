exports.isNotAuth = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    return res.status(404).render("error/404", {
      pageTitle: "NotFound",
      path: "",
    });
  }
  next();
};

exports.isAuth = (req, res, next) => {
  if (req.session.isLoggedIn) {
    return res.redirect("/")
  }
  next();
};
