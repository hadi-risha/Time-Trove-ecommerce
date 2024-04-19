const mongoose=require("mongoose");

// schema is the format of document
// coupon schema
const coupondb = new mongoose.Schema({
    couponCode:{
        type:String,
        required:true
     },
     discount:{
        type:Number,
        required:true
     },
    maxUses:{
        type:Number,
        required:true,
     },
     useAbove:{
         type:String,
         required:true
     },
     expDate:{
         type:Date,
         required: true
     },
     usedUsers: [{
        email: { type: String }
     }],
     unlisted: {
        type: Boolean,
        default: false,
     }
}, { timestamps: true });

const couponDB= new mongoose.model("couponDb",coupondb);


module.exports = couponDB; 