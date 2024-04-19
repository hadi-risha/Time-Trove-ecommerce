//*********** custom user middlewares ************

//if logged in, then cannot access login and signup
function useralreadyloggined(req,res,next){
  const {isUserAuthenticated} = req.session;
  if(isUserAuthenticated){
    console.log(isUserAuthenticated);
    res.redirect('/');
    console.log('you are already logged in');
  }else{
    console.log(isUserAuthenticated);
    console.log('you are not loggedin');
    next();
  }
}
    

//if not logged in, then cannot access any other pages

function notAuth(req,res,next){
  if(!req.session.isUserAuthenticated){
    res.redirect('/');
    console.log('you are not loggined');
  }else{
    next(); 
  }
}


function isAuth(req,res,next){
  if(!req.session.isUserAuthenticated){
    res.redirect('/user-login');
    console.log('you are not loggined');
  }else{
    next(); 
  }
}

    
//if set-psw link  not emailed, can't access set-psw page."
function sendpswLink(req,res,next){
  console.log(req.session.emailLink);
  if(req.session.emailLink){
    next();
    console.log('link shared,please check email');
  }else{
    console.log('link not shared, so cannot access set-psw page');
    res.redirect('/user-login')
  }
}
   

//If user not verified, provide otp access.
async function otpAccess(req,res,next){
  if(req.session.userRegistered){
    console.log("you can verify now");
    next()
  }else{
    res.redirect("/user-login")
    console.log("can't verify or already verified");
  }       
}


//if user registered - allow otp access
async function otpAccessAddit(req,res,next){
  if(req.session.userRegistered){
    console.log("you are registered,you can verify now");
    next()
  }else{
    res.redirect("/user-login")
    console.log("youre not registered,cannot access otp");
  }       
}


function notFoundHandler(req, res, next) {
  console.log("not found page working");
  // res.status(404).send('<h1>404: Page Not Found</h1>');
  res.status(404).render('404');
 }
 


module.exports = {notFoundHandler,useralreadyloggined, notAuth, sendpswLink, otpAccess, otpAccessAddit, isAuth}