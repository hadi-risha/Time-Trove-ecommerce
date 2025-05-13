//email handler
const nodemailer = require("nodemailer");        //will enable us to send the email in our application
//env variable
const mailgen = require("mailgen");
const forgotDB = require("../model/forgotPswModel");


// nodemailer stuff
let linkTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: 'hadirisha62@gmail.com',
      pass: 'tnnz omus fowe rpgz'
    }
})

// generate random  links
const generateRandomLink = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let link = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      link += characters.charAt(randomIndex);
    }
    console.log(link);
    return link;
};


const sendLinkMail = async (req, res) => {
    const randomLink = generateRandomLink(40);     // can adjust the length of the random link as needed

    const MailGenerator = new mailgen({        //create an instance of mailgen library
        theme: "default",
        product: {
        name: "Time Trove",
        link: "https://mailgen.js/",                  
        // logo: "Time trove",
        },
    });

    const response = {                  //it's used to create structure the content for the email structure
        body: {                   
        name: req.session.fUserEmail,
        intro: "To reset your password for Time Trove, click the link below:",
        table: {
            data: [
            {
                // resetLink : `http://localhost:3031/set-psw?token=${randomLink}`   
                resetLink : `http://13.236.183.171:3031/set-psw?token=${randomLink}`                           
            },
            ],
        },
        outro: "If you did not request a password reset, please ignore this email.",
        },
    };

    const forgotMail = MailGenerator.generate(response);

    const message = {
        from: process.env.AUTH_EMAIL,             
        to: req.session.fUserEmail,
        subject: "Time Trove Password Reset",
        html: forgotMail,                    
    };

    try{
        const newLink = new forgotDB({           
            email: req.session.fUserEmail,
            link: randomLink,
        });
        const data = await newLink.save();
        console.log(data)
        req.session.resetLinkId = data._id;
        req.session.forgotLink = data.link;             //added to chech entered otp and db otp is match with   
        req.session.expireAt = data.expireAt;            // to check expire time in verification       
        
        res.status(200).redirect("/forgot-password");
        await linkTransporter.sendMail(message);                
    }catch(error) {
        console.log(error);
    }
}


module.exports = { linkTransporter, sendLinkMail };