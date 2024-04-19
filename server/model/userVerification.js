const mongoose = require("mongoose");

// schema is the format of document
// user verification schema
const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        // expires: 60 * 2 
        expires: 40
    },
});  

// const verificationCollection=new mongoose.model("VerificationCollection",UserVerificationSchema);
const Otpdb = new mongoose.model("otpDb", otpSchema);



module.exports = Otpdb;