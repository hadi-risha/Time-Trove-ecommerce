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
            default: () => Date.now(),
        },
        action:{
            type:"string",
            default:''
        }
    }]
}, { timestamps: true });


// Update the transactionDate dynamically before saving
// userWalletSchema.pre('save', function(next) {
//     if (this.isNew && this.transactions.length > 0) {
//         const currentDate = new Date();
//         this.transactions.forEach(transaction => {
//             if (!transaction.transactionDate) {
//                 transaction.transactionDate = currentDate;
//             }
//         });
//     }
//     next();
// });

const walletDB = new mongoose.model("walletdbs",userWalletSchema);


module.exports = walletDB;