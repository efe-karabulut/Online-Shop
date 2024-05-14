exports.getHomePage = (req, res, next) => {
  res.render("home/home", {
    path: "home-layout",
    pageTitle: "Home",
  });
};
