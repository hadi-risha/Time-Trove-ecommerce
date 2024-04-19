const mongoose=require("mongoose");

// schema is the format of document
// shoppingcart schema
const shoppingCartDb = new mongoose.Schema({
    email:{
        type:String,
     },
     productId: {
        type: mongoose.SchemaTypes.ObjectId,
        required:true,
     },
      userAddedQuantity: {
         type:Number,
         required:true,
         default: 1,
     },
}, { timestamps: true });

const shoppingCartDB = new mongoose.model("shoppingCartDb",shoppingCartDb);


module.exports = shoppingCartDB;