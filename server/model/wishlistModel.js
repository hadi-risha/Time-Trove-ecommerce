const mongoose=require("mongoose");

// schema is the format of document
// Wishlist schema
const wishListSchema = new mongoose.Schema({
    email:{
        type:String,
     },
     productId: {
        type: mongoose.SchemaTypes.ObjectId,
        required:true,
     }
}, { timestamps: true });

const wishlistDB = new mongoose.model("wishlistDb",wishListSchema);


module.exports = wishlistDB;