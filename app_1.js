const port = 3000;
const express = require("express");
const app = express();
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const csrf = require("csurf");
const csrfProtection = csrf();
const flash = require("connect-flash");
const multer = require("multer");

// Routes import Start
const adminRoutes = require("./Routes/admin");
const shopRoutes = require("./Routes/shop");
const errorRoutes = require("./Routes/error");
const homeRoutes = require("./Routes/home");
const cartRoutes = require("./Routes/cart");
const signInRoutes = require("./Routes/sign-in");
const signUpRoutes = require("./Routes/sign-up");
// Routes import End

// Models start
const User = require("./models/user");
// Models end

// Util start
require("dotenv").config
const rootDir = require("./util/mainRoot");
const mongoConnect = require("./util/connect_db").mongoConnect;
// Util End

// template engine ve views klasörü ayarlarda tanımlanır
// ayarlamalar başlar...
app.set("view engine", "ejs");
app.set("views", path.join(rootDir, "views"));
// ayarlamalar biter.

// static olarak Public dosyası başlar
app.use(express.static(path.join(rootDir, "public")));
app.use("/images", express.static(path.join(rootDir, "images")));
// static olarak Public dosyası biter

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(
      null,
        file.fieldname +
        "-" +
        new Date().toISOString() +
        "-" +
        file.originalname
    );
  },
});

const newFileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(
  multer({ storage: fileStorage, fileFilter: newFileFilter }).single("image")
);
// Ayrıştırma Chunk Buffer işleri:
app.use(express.urlencoded({ extended: true }));
//Ayrıştırma Biter

// Session Middleware start
app.use(
  session({
    secret: "mySecret",
    resave: false,
    saveUninitialized: false,
    name: "LOGIN_INFO",
    store: MongoStore.create({
      mongoUrl:
        "mongodb+srv://EfeKarabulut:ATovMdlwrgPsS8FC@ourshop.ujrgiwb.mongodb.net/ourShop?retryWrites=true&w=majority&appName=OurShop",
    }),
  })
);
// Session MATovMdlwrgPsS8FCiddleware end

// CSRF token middleware start
app.use(csrfProtection);
// CSRF token middleware end

//Flash message middleware start
app.use(flash());
//Flash message middleware end

// session id si var ise kullanıcıyı bul ve model methodlarını kullanmak için req.user a gönder. // burada başlar
app.use((req, res, next) => {
  if (!req.session.userId) {
    return next();
  }
  User.userFindById(req.session.userId)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = new User(
        user.user_name,
        user.user_password,
        user.user_email,
        user.user_cart,
        user._id
      );
      next();
    })
    .catch((err) => {
      throw new Error(err);
    });
});
// Burada biter

// önbelleği devre dışı bırak
// Middleware Start
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});
// Middleware End

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

// Routes Start
app.use("/admin", adminRoutes);
app.use(signUpRoutes);
app.use(signInRoutes);
app.use(shopRoutes);
app.use(cartRoutes);
app.use(homeRoutes);
app.use(errorRoutes);
//Routes End

app.use((err, req, res, next) => {
  console.error("Error: ", err.status, err.message, err.stack);
  res.redirect("/error/code/500");
});

mongoConnect(() => {
  app.listen(port);
});
