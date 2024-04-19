const mongoose=require("mongoose");

// schema is the format of document
// forgot password schema
const forgotLinkSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },link: {
        type: String,
        required: true,
    }, 
    createdAt: {
        type: Date,
        default: Date.now(),
        expires: 60 * 1 
    },
})

const forgotDB = new mongoose.model("forgotDB", forgotLinkSchema);


module.exports = forgotDB;