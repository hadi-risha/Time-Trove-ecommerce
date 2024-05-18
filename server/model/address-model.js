const mongoose=require("mongoose");

// schema is the format of document
// address sample schema
const addressDb = new mongoose.Schema({
    userId:{
      type:String,
      required:true
    },
    pincode:{
        type:String,
        required:true
     },
     state:{
        type:String,
        required:true
     },
    address:{
        type:String,
        required:true,
     },
     district:{
         type:String,
         required:true
     },
     mobile:{
         type:String,
         required: true
     },
     addressType:{
        type: String, 
        required: true
     },
     email:{
        type:String,
        required: true
     },  
}, { timestamps: true });//enables automatic creation of 'createdAt' and 'updatedAt' fields

const AddressDB= new mongoose.model("DBforAddress",addressDb);


module.exports = AddressDB; 