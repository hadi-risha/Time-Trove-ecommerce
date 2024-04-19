
//********custom admin middlewares**********
function isAuthenticate(req, res, next) {
    if (req.session.isAuth) {
      next();
    } else {
      res.redirect("/admin");
    }
  }

  function Authenticate(req, res, next) {
    if (req.session.isAuth) {
      res.redirect("/adminHome");
    } else {
      next();
    }
  }

  function notFoundHandler(req, res, next) {
    console.log("not found page working");
    // res.status(404).send('<h1>404: Page Not Found</h1>');
    res.status(404).render('404');
   }
  

  module.exports = { isAuthenticate, notFoundHandler, Authenticate }