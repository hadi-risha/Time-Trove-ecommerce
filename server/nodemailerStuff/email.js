//email handler
const nodemailer = require("nodemailer");        //will enable us to send the email in our application
//env variable
const mailgen = require("mailgen");
const Otpdb = require("../model/userVerification");



// nodemailer stuff
let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: 'hadirisha62@gmail.com',
      pass: 'tnnz omus fowe rpgz'
    }
})

// testing access
transporter.verify((error, success) => {       //verify - ensuring that email setup is correct before attempting to send actual emails
    if(error) {
        console.log(error);
    }else{
        console.log("Ready for messages");
        console.log(success);
    }
});

// generate random OTP numbers
const otpGenerator = () =>{                
    return `${Math.floor(1000 + Math.random() * 9000)}`;
};
  
const sendOtpMail = async (req, res) => {
    const otp = otpGenerator();

    const MailGenerator = new mailgen({           //create an instance of mailgen library
        theme: "default",
        product: {
        name: "Time Trove",
        link: "https://mailgen.js/",                  
        // logo: "Time trove",
        },
    });

    const response = {                  //it's used to create structure the content for the email structure
        body: {                   
        name: req.session.userEmail,
        intro: "Your OTP for Time Trove verification is:",
        table: {
            data: [
            {
                OTP: otp,                                    
            },
            ],
        },
        outro: "Looking forward to doing more business",
        },
    };

    const mail = MailGenerator.generate(response);

    const message = {
        from: process.env.AUTH_EMAIL,             
        to: req.session.userEmail,
        subject: "Time Trove OTP Verification",
        html: mail,                    
    };

    try{
        const newOtp = new Otpdb({           
            email: req.session.userEmail,
            otp: otp,
        });
        const data = await newOtp.save();
        console.log(data)
        req.session.otpId = data._id;
        req.session.otp = data.otp;                       //added to check if the entered otp matches the otp in the database.  
        req.session.expireAt = data.expireAt            // to check expire time in verification       
        res.status(200).redirect("/otp-verification");
        await transporter.sendMail(message);                
    }catch(error) {
        console.log(error);
    }
};




module.exports = { transporter, sendOtpMail };
