const mongoose=require("mongoose");

// schema is the format of document
// User schema
const UserDB = new mongoose.Schema({
    name:{
        type:String,
        required:true
     },
     phno:{
        type:String
     },
     address:String,
     city:String,
    email:{
        type:String,
        required:true,
        unique:true 
     },
     password:{
         type:String,
         required:true
     },
     confirmPassword:{
         type:String,
         required:true
     },
     verified:{
        type: Boolean,
        default: false,
     },
     isBlocked: {
        type: Boolean,
        default: false,
     }
     ,
     gender:{
      type:String
     },
     wallet:{
      type:Number,
      default:0
     },
     referralLink: {
         type: String,
         unique: true
      },
}, { timestamps: true });

const userdbCollection=new mongoose.model("UserdbCollection",UserDB);


module.exports = userdbCollection;