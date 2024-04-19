const mongoose = require('mongoose');

// schema is the format of document
// product schema
const productSchema = new mongoose.Schema({
      productName: {
        type: String,
        required: true,
      },
      category: {
        type: String, 
        required: true,
      },
      productDescription: {
        type: String,
        required: true, 
      },
      firstPrice: {
        type: Number,
        required: true,
      },
      lastPrice: {
        type: Number,
        required: true,
      },
      discount: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      images: [{
        type: String
      }],
      unlisted: {
        type: Boolean,
        default: false,
      },
      addToBag: {
        type: Boolean,
        default: false,
      },
      productofferDiscount:{
        type:Number
      },
      productofferExpDate:{
        type:Date
      },
      categoryofferDiscount:{
        type:Number
      },
      categoryofferExpDate:{
        type:Date
      },

    }, { timestamps: true });

const productDB = mongoose.model('Productdb', productSchema);


module.exports = productDB;
