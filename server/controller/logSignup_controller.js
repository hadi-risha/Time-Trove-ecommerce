const bcrypt = require('bcryptjs');      //password handler
const userdbCollection = require("../model/model");      
const Otpdb = require("../model/userVerification");        

//nodemailer stuff
const {sendOtpMail} = require('../nodemailerStuff/email');
const {sendLinkMail} = require('../nodemailerStuff/forgotLink');      
const walletDB = require('../model/walletModel');
const referralOfferDB = require("../model/referralModel")


//signup - POST
const userSignup = {
  async signup(req, res) {
    try {

      //create a new user
      const {email} = req.body;
      const Email = email.trim();       

      //hashing password before creating user
      const {password, confirmPassword, name} = req.body;

      const hashedPassword = bcrypt.hashSync(password, 10);        
      
      //psw checking
      if(password !== confirmPassword) {       
        req.session.passnotmatch = true
        res.redirect("/signup")
        return
      }

      //name validation
      if (!/^[A-Za-z\s]+$/.test(name)) {        
        req.session.namenotvalid = true;
        res.redirect("/signup");
        return;
      }
  
      const result = await userdbCollection.findOne({ email: email });
        if(result) {
          //A user already exists
          req.session.userExist = true;
          console.log("email already in use")
          res.redirect("/signup");
          return;
        }
      
      const {phno, address, city} = req.body;

      const newUser = new userdbCollection({
              name: name,
              phno: phno || null,     //if value not enter it will be null
              address: address || null,
              city: city || null,
              email: Email,
              password: hashedPassword,
              confirmPassword: hashedPassword
            });

      const user = await newUser.save();
        if(user){
          req.session.userRegistered = true;
          req.session.uRegistered - true
        }



        //************ referalLink *********** *//
        const referralLink = `http://localhost:3030/signup?userId=${user._id}`;
        await userdbCollection.updateOne({ _id: user._id },{ $set: { referralLink: referralLink } });


        console.log("referral id ( _id of old user )", req.body.referralId); //track referral id
        const referralId = req.body.referralId
        if(user){
          const referredUser = await userdbCollection.findOne({_id: referralId});
          if(referredUser){
            console.log("referred user exist");
            const referrerEmail = referredUser.email;
            // console.log("referrerEmail", referrerEmail);
            const referralOfferData = await referralOfferDB.findOne();
            const referralAmount = referralOfferData.referralAmount;
            // console.log("referralAmount", referralAmount);
            const referredUserReward = referralOfferData.referredUserReward;
            // console.log("referredUserReward", referredUserReward);

            const existinguserWallet = await walletDB.findOneAndUpdate({email : referrerEmail}, {$inc:{balance : referralAmount }}, {new : true, upsert: true});
            if(existinguserWallet.modifiedCount === 0){
              console.log("referral amount not added in wallet");
            }else{
              console.log("referral amount added in wallet");
            }

            const newUserWallet = await walletDB.findOneAndUpdate({email : user.email}, {$inc:{balance : referredUserReward }}, {new : true, upsert: true});
            if(newUserWallet.modifiedCount === 0){
              console.log("reward amount not added in wallet");
            }else{
              console.log("reward amount added in wallet");
            }

          }else{
            console.log("invalid referal Link");
            // invalid referal code case here
            // sweetAlert
            req.session.invalidReferalLink = true
          }
        }
        //************ /referalLink *********** *//

      req.session.userEmail = user.email;
      await sendOtpMail(req, res);
      // req.session.otpSentToEmail = true;
      console.log(user);
      //sent otp
    
    }catch(err) {
      console.log('register error', err);
      res.send('Internal server error');
    }
  },
};


//otp-verification - POST
const otpVerification = {
  async otpSetup(req, res) {
    const {userProvidedOTP} = req.body;
    const {reset} = req.query;

    if(userProvidedOTP == "" && !reset){
      req.session.ProvidedOTP = 'This Field is required';                      //instead of true
      res.redirect("/otp-verification");
      console.log("This Field is required");
      return
    }

    const { otpId} = req.session;
    const data = await Otpdb.findOne({_id:otpId});
      
      if(data){
        if(data.otp !== userProvidedOTP){
          req.session.ProvidedOTP = 'Incorrect OTP';                             //instead of true
          res.redirect("/otp-verification");
          console.log("OTP does not match");
        }else{
          try{
            //update the verified column
            const { userEmail} = req.session;
            const u = await userdbCollection.updateOne({ email: userEmail }, { $set: { verified:true} });
            const userVerified = u.verified;
            console.log(u);
            res.redirect('/user-login'); 
            console.log("OTP verified successfully,'verified' column updated to true");
          }catch(err) {
            console.error("Error updating 'verified' column:", err);
            res.status(500).send("Internal server error");
          }
        }
      }else{
        req.session.otpNotExist = true;         //used for timer
        req.session.ProvidedOTP = 'Incorrect OTP';
        console.log("OTP Expired or Incorrect OTP");
        res.redirect("/otp-verification");
      }
  }
};


// testing                   
const resendOtp = {
  async otpSetup(req, res) {
    const { userEmail } = req.session;
    console.log("resend otp sectionn,user email : ", userEmail);
    const result = await Otpdb.deleteMany({ email : userEmail });
      console.log('old otp successfully deleted from db: ',result)

    const {reset} = req.query;
    if(reset){
      await sendOtpMail(req,res);
    }
  }
};


//user login-POST
const setupLogin = {
  async loginUser(req, res) {
    let { email, password } = req.body;

    email = email.trim();

    //check if the user exists
    userdbCollection.findOne({ email })
    .then(result =>{
        if(result){

            // user exists
            if(bcrypt.compareSync(password, result.password)) {
                console.log('Password is correct!');
                if( result.verified ){
                    if( result.isBlocked === true ){
                      req.session.youAreBlocked = true;
                      res.redirect('/user-login')
                    }else{
                      req.session.isUserAuth = true;   //used for login msg
                      req.session.isUserAuthenticated = true;    //this session used b/w login/signup middleware
                      req.session.loginEmail = email;
                      req.session.userEmail = email;

                      res.redirect('/');
                    }       
                }else{
                  req.session.userEmail = email;
                  req.session.notVerified=true;
                  res.redirect("/user-login");
                }
            }else{
                //incorrect password
                req.session.passincorrect = true;
                res.redirect("/user-login");
            }
        }else{
          //invalid credentials
          console.log("Invalid credentials entered");
          req.session.invalidCredentials = true;
          res.redirect('/user-login');
        }
    })
    .catch(err => {
        console.log(err);
        console.log("An error occurred while comparing passwords");
        res.status(500).send("Internal server error");
    });
  },
};



//user-logout - POST
const userLogout = {
  usersignout(req, res) {
    req.session.isUserAuthenticated = false;         //this session used b/w login/signup middleware
    req.session.logoutSuccess = true;

    // req.session.destroy();
    res.redirect("/");
  },
};


//forgot-password - POST
const forgotPsw = {
  async pswSetup(req, res) {
    const { email } = req.body;
    req.session.fUserEmail = email;

    //checking user already exist in db,otherwise cannot  update psw
    let userExist = await userdbCollection.findOne({ email : email })
      if(userExist){ 
        const {userEmail} = req.session;
        if(userEmail){ 
          console.log("user authenticated"); 
          if( email == userEmail ){ 
            req.session.emailLink = true; 
            req.session.backLink = true; 
            sendLinkMail(req, res);
            console.log("Link sent to email");
          }else{
            req.session.emailMatchError = true;
            console.log("The email provided does not match the email associated with your logged-in account. Use your logged-in email.");
            res.redirect('/forgot-password');
          }
        }else{ 
          console.log("user not authenticated"); 
          req.session.emailLink = true; 
          req.session.backLink = true;  
          sendLinkMail(req, res);
          
          console.log('here is the sendLinkMail:', sendLinkMail);
        }

      }else{
        req.session.forgotUserNotExist=true
        console.log("user not exist,so cannot reset password");
        res.status(401).redirect('/forgot-password');
      }
  },
};


//authUser-forgotPassword - POST
const authUserforgotPsw = {
  async pswSetup(req, res) {
    req.session.fUserEmail = req.body.email;
  
    //checking if the user already exists in the database.otherwise, password update is not allowed
    if(req.body.email == req.session.userEmail){ 
      req.session.emailLink = true; 
      req.session.backLink = true; 
      sendLinkMail(req, res);
      console.log("link sent to email..");
    }else{
      req.session.forgotUserNotExist=true
      console.log("user not exist,so cannot reset password");
      res.status(401).redirect('/forgot-password');
    }
  },
};


// set-psw - POST
const setPsw = {
  async setNewPsw(req, res) {
    try{
      const {newPassword, confirmNewPassword} = req.body;

        console.log("The user's new password : ",confirmNewPassword);
        const hashedNewPassword = bcrypt.hashSync(newPassword, 10);    //hashing newpsw
        console.log('here is the hashed new password => ',hashedNewPassword);

        //validate newPassword
        if(!/\S+/.test(newPassword)) {
          req.session.invalidPassword = true;
          console.log('Password must contain at least one non-space character.');
          res.redirect("/set-psw");
          return;
        }

        //psw checking, verifying that both passwords match
        if( newPassword !== confirmNewPassword ){           
          req.session.fpasswordNotMatch = true;
          console.log("password not match");
          res.redirect("/set-psw");                               
        }else{
          const {fUserEmail} = req.session;
          const updateResult = await userdbCollection.updateOne({ email : fUserEmail },{$set: {password: hashedNewPassword,confirmPassword: hashedNewPassword}});
          console.log('user email',fUserEmail);
          console.log('details of the changed password : ',updateResult);
          console.log('successfully updated password in userdb');
            if( !req.session.isUserAuthenticated ){
              console.log('password reset successful. You are not logged in,so redirecting to login page');
              req.session.successPswReset = true;
              res.redirect('/user-login');
            }else{
              console.log('ppassword reset successful.you are already logged in,so redirecting to home page');
              req.session.successPasswordReset = true;
              res.redirect('/');
            }
        }
    }catch(err) {
      console.log('reset password error', err);
      res.send('Internal server error');
    }
  },
};       




module.exports = { userSignup, setupLogin, otpVerification, userLogout, resendOtp, forgotPsw, authUserforgotPsw, setPsw };