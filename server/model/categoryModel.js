const mongoose=require("mongoose");

// schema is the format of document
// User schema
const catdb = new mongoose.Schema({
    category:{
        type:String,
        required:true,
        unique:true 
     },
     unlisted: {
        type: Boolean,
        default: false,
     }
}, { timestamps: true });

const categoryDB = new mongoose.model("categorydb",catdb);


module.exports = categoryDB;