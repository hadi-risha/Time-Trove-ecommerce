const mongoose = require('mongoose');

// schema is the format of document
// order schema
const orderSchema = new mongoose.Schema({
    // userId: {
    //     type: mongoose.SchemaTypes.ObjectId,
    //     required: true,
    // },
    email:{
        type:String,
        required: true
    },
    orderItems: [
        {
            productId: {
                type: mongoose.SchemaTypes.ObjectId,
                required: true,
            },
            pName: {
                type: String,
                required: true
            },
            pDescription: {
                type: String,
                required: true
            },
            firstPrice: {
                type: Number,
                required: true
            },
            lastPrice: {
                type: Number,
                required: true
            },
            discount: {
                type: Number,
                required: true,
              },
            quantity: {
                type: Number,
                required: true
            }, 
            userAddedQty: {
                type: Number,
                required: true 
            },
            images: [{
                type: String
            }],
            orderStatus: {
                type: String,
                default: "ordered",
                required: true
            },
            category: {
                type: String,
                required: true
            },
            productofferDiscount:{
                type:Number
            },
            categoryofferDiscount:{
                type:Number
            },
        }
    ],
    
    paymentMethod: {
        type: String,
        required: true 
    },
    orderDate: {
        type: Date,
        default: Date.now()
    },
    selectedAddress: [
        {
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
        }
    ],
    finalAmount:{
        type:Number
    },
    balanceToPay:{
        type: Number,
        default: 0
    },
    paymentstatus : {
        type:String,
        default : 'pending'
    },
    usedCouponDiscount: {
        type: Number
    },
    finalAmountWithoutCoupon:{
        type: Number
    }
}, { timestamps: true });

const Orderdb = mongoose.model('orderdbs', orderSchema);


module.exports = Orderdb;
