const mongoose=require("mongoose");

// schema is the format of document
// coupon schema
const productOfferdb = new mongoose.Schema({
    product:{
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

const ProductOfferDB= new mongoose.model("ProductOfferDb",productOfferdb);


module.exports = ProductOfferDB; 