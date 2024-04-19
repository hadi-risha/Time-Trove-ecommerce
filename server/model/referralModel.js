const mongoose = require('mongoose');

const referralOfferSchema = new mongoose.Schema({
    //  referrerEmail:{
    //     type:[String],
    //     unique: true
    //  },
    referralAmount: {
        type: Number,
        required: true
    },
    // referredUserEmail:{
    //     type:[String],
    //     unique: true
    //  },
    referredUserReward: {
        type: Number,
        required: true
    },
    expDate: {
        type: Date,
        required: true
    }
});

module.exports = mongoose.model('referralOfferDB', referralOfferSchema);