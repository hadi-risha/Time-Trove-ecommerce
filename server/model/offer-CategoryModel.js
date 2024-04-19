const mongoose=require("mongoose");

// schema is the format of document
// coupon schema
const categoryOfferdb = new mongoose.Schema({
    category:{
        type:String,
        required:true
     },
     discount:{
        type:Number,
        required:true
     },
     expDate:{
         type:Date,
         required: true
     },
     unlisted: {
        type: Boolean,
        default: false,
     }
}, { timestamps: true });

const categoryOfferDB= new mongoose.model("categoryOfferDb",categoryOfferdb);


module.exports = categoryOfferDB; 