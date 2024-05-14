const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { validationResult } = require("express-validator");

const User = require("../models/user");

let transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  auth: {
    user: "apikey",
    pass: process.env.SENDGRID_API_KEY,
  },
});

exports.getSignUp = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("sign-up/sign-up", {
    path: "sign-up-layout",
    pageTitle: "Sign up",
    errorMessage: message,
    oldInput: {
      oldName: "",
      oldEmail: "",
    },
    validationErr: [],
  });
};

exports.postSignUp = (req, res, next) => {
  const name = req.body.signUpName;
  const email = req.body.signUpEmail;
  const password = req.body.signUpPassword;

  const error = validationResult(req);
  if (!error.isEmpty()) {
    console.log(error.array());
    return res.status(422).render("sign-up/sign-up", {
      path: "sign-up-layout",
      pageTitle: "Sign up",
      errorMessage: error.array()[0].msg,
      oldInput: {
        oldName: name,
        oldEmail: email,
      },
      validationErr: error.array(),
    });
  }

  const mailOption = {
    from: "info.efekarabulut@gmail.com",
    to: email,
    subject: "Sign up succesfull",
    html: "<h1>Hello</h1>",
  };

  return User.userFindByEmail(email)
    .then((doMatch) => {
      if (doMatch) {
        req.flash("error", "This email is already exist!");
        return res.redirect("/sign-up");
      }
      return bcrypt
        .hash(password, 12)
        .then((hashPassword) => {
          const user = new User(name, hashPassword, email, { items: [] });
          return user
            .saveUser()
            .then((user) => {
              res.redirect("/sign-in");
              transporter.sendMail(mailOption, (err, info) => {
                if (err) {
                  console.log("erorcuk", err);
                } else {
                  console.log("mesaj gönderildi", info.response);
                }
              });
            })
            .catch((err) => {
              const error = new Error(
                "Kullanıcı bilgileri kayıt edilirken DB'de hata meydana geldi. From: postSignUp()"
              );
              error.status = 500;
              return next(error);
            });
        })
        .catch((err) => {
          const error = new Error(
            "Kullanıcının şifresi hash password'a çevirilirken bir hata meydana geldi. From: postSignUp()"
          );
          error.status = 500;
          return next(error);
        });
    })
    .catch((err) => {
      const error = new Error(
        "Kullanıcının Email adresine göre arama yapılırken DB'de hata meydana geldi. From: postSignUp()"
      );
      error.status = 500;
      return next(error);
    });
};
