const User = require("../models/user");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  auth: {
    user: "apikey",
    pass: process.env.SENDGRID_API_KEY,
  },
});

exports.getSignIn = (req, res, next) => {
  let errMessage = req.flash("error");
  let doneMessage = req.flash("success");
  errMessage = errMessage.length > 0 ? errMessage[0] : null;
  doneMessage = doneMessage.length > 0 ? doneMessage[0] : null;

  res.render("sign-in/sign-in", {
    path: "sign-in-layout",
    pageTitle: "Sign in",
    errorMessage: errMessage,
    successMessage: doneMessage,
    oldLoginEmail: "",
    validationError: { path: "" },
  });
};

exports.postSignIn = (req, res, next) => {
  const email = req.body.signInEmail;
  const password = req.body.signInPassword;
  User.userFindByEmail(email)
    .then((user) => {
      if (!user) {
        return res.render("sign-in/sign-in", {
          path: "sign-in-layout",
          pageTitle: "Sign in",
          errorMessage: "Invalid E-mail or password!",
          successMessage: null,
          oldLoginEmail: email,
          validationError: { path: "signInEmail" },
        });
      }
      return bcrypt
        .compare(password, user.user_password)
        .then((doMatch) => {
          if (!doMatch) {
            return res.status(422).render("sign-in/sign-in", {
              path: "sign-in-layout",
              pageTitle: "Sign in",
              errorMessage: "Invalid E-mail or password!",
              successMessage: null,
              oldLoginEmail: "",
              validationError: { path: "" },
            });
          }
          req.session.isLoggedIn = true;
          req.session.userId = user._id;
          return req.session.save((err) => {
            if (err) {
              const error = new Error(
                "Kullanıcın Session bilgileri kayıt edilirken Session.Save'de hata meydana geldi. From: postSignIn()"
              );
              error.status = 500;
              return next(error);
            }
            return res.redirect("/");
          });
        })
        .catch((err) => {
          const error = new Error(
            "Kullanıcın girdiği şifre hash ile eşleştirilmeye çalışırken bcrypt'de hata meydana geldi. From: postSignIn()"
          );
          error.status = 500;
          return next(error);
        });
    })
    .catch((err) => {
      const error = new Error(
        "Email adresine göre kullanıcı aranırken DB'de hata meydana geldi. From: postSignIn()"
      );
      error.status = 500;
      return next(error);
    });
};

exports.postSignOut = (req, res, next) => {
  req.session.destroy((err) => {
    if (!err) {
      return res.redirect("/");
    } else {
      const error = new Error(
        "Kullanıcı çıkış yaparken session silme kısmında hata meydana geldi. From: postSignOut()"
      );
      error.status = 500;
      return next(error);
    }
  });
};

exports.getForgotPassword = (req, res, next) => {
  let errMessage = req.flash("error");
  let doneMessage = req.flash("success");
  errMessage = errMessage.length > 0 ? errMessage[0] : null;
  doneMessage = doneMessage.length > 0 ? doneMessage[0] : null;

  res.render("sign-in/forgotPassword", {
    path: "forgot-layout",
    pageTitle: "Reset Password",
    errorMessage: errMessage,
    successMessage: doneMessage,
  });
};

exports.postResetPassword = (req, res, next) => {
  const email = req.body.email;
  User.userFindByEmail(email)
    .then((doMatch) => {
      if (!doMatch) {
        req.flash("error", "No such email address found!");
        return res.redirect("/forgot-password");
      }
      User.generateResetPasswordToken(doMatch._id)
        .then((token) => {
          transporter.sendMail({
            from: "info.efekarabulut@gmail.com",
            to: email,
            subject: "Reset your password",
            html: `
            <p>Click on the following link to reset your password</p>
            <br>
            <a href="http://localhost:3000/reset/password/${token}" style"color:blue">Reset Password</a>
            `,
          });
          req.flash(
            "success",
            "Password reset content successfully sent to your email address "
          );
          res.redirect("/forgot-password");
        })
        .catch((err) => {
          const error = new Error(
            "Kullanıcıya Reset token'ı oluşturulurken bir hata meydana geldi. From: postResetPassword()"
          );
          error.status = 500;
          return next(error);
        });
    })
    .catch((err) => {
      const error = new Error(
        "Email adresine göre kullanıcı aranırken DB'de hata meydana geldi. From: postResetPassword()"
      );
      error.status = 500;
      return next(error);
    });
};

exports.getUpdatePassword = (req, res, next) => {
  let errMessage = req.flash("error");
  errMessage = errMessage.length > 0 ? errMessage[0] : null;
  const token = req.params.token;
  User.userFindByTokenAndDate(token)
    .then((user) => {
      if (!user) {
        req.flash("error", "Request timed out please try again ");
        return res.redirect("/forgot-password");
      }
      res.render("sign-in/resetPassword-form", {
        path: "reset-layout",
        pageTitle: "New Password",
        errorMessage: errMessage,
        passwordToken: token,
        userId: user._id.toString(),
      });
    })
    .catch((err) => {
      const error = new Error(
        "Kullanıcının Token ve Date bilgisine göre arama yapılırken DB'de hata meydana geldi. From: getUpdatePassword()"
      );
      error.status = 500;
      return next(error);
    });
};

exports.postUpdatePassword = (req, res, next) => {
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  const newPassword = req.body.resetPassword;
  User.userFindByIdAndToken(passwordToken, userId)
    .then((user) => {
      return bcrypt
        .hash(newPassword, 12)
        .then((hasNewPassword) => {
          User.userUpdateNewPassword(user._id, hasNewPassword)
            .then((result) => {
              req.flash("success", "Password successfully changed.");
              res.redirect("/sign-in");
            })
            .catch((err) => {
              const error = new Error(
                "Kullanıcının yeni şifresi ile kayıt edilirken DB'de hata meydana geldi. From: postUpdatePassword()"
              );
              error.status = 500;
              return next(error);
            });
        })
        .catch((err) => {
          const error = new Error(
            "Kullanıcının yeni şifresi hash password'a çevirilirken bir hata meydana geldi. From: postUpdatePassword()"
          );
          error.status = 500;
          return next(error);
        });
    })
    .catch((err) => {
      const error = new Error(
        "Kullanıcının Token ve Id bilgisine göre arama yapılırken DB'de hata meydana geldi. From: postUpdatePassword()"
      );
      error.status = 500;
      return next(error);
    });
};
