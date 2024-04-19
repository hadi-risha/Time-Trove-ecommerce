const mongoose = require('mongoose');

const userWalletSchema = new mongoose.Schema({
    email:{
        type:String,
        required: true
     },
    balance: {
        type: Number,
        default: 0,
    },
    transactions: [{
        amount: {
            type: Number
        },
        transactionDate: {
            type: Date,
            default: Date.now(),
        },
        action:{
            type:"string",
            default:''
        }
    }]
}, { timestamps: true });

const walletDB = new mongoose.model("walletdbs",userWalletSchema);


module.exports = walletDB;