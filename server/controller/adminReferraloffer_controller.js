const referralOfferDB = require ("../model/referralModel");



// add referral offer - POST
const addReferralOffer = {
    async createOffer(req, res) {
      try {
        const { referralAmount, referredUserReward, expDate } = req.body;
        const trimmedReferralAmount = referralAmount.trim();
        const trimmedReferredUserReward = referredUserReward.trim();
      
        if (!/\d{1,}/.test(trimmedReferralAmount)) {
            req.session.invalidReferralAmount = true;
            console.log('referral Amount should contain at least 1 numbers');
            res.redirect('/add-referralOffer');
            return;
        }
        
        if (!/^(?:\d*\.)?\d+$/.test(trimmedReferralAmount)) {
            console.log('Please provide non-negative values as referral amount.');
            req.session.negativeReferralAmount = true;
            res.redirect('/add-referralOffer');
            return;
        }
        
        if (!/\d{2,}/.test(trimmedReferredUserReward)) {
            req.session.invalidUserReward = true;
            console.log('user Reward should contain at least 1 numbers');
            res.redirect('/add-referralOffer');
            return;
        }
        
        if (!/^(?:\d*\.)?\d+$/.test(trimmedReferredUserReward)) {
            console.log('Please provide non-negative values for Referred User Reward.');
            req.session.negativeUserReward = true;
            res.redirect('/add-referralOffer');
            return;
        }
        
        const newReferralOffer = new referralOfferDB({
            referralAmount : trimmedReferralAmount,
            referredUserReward : trimmedReferredUserReward,
            expDate : expDate
        });

        const result = await newReferralOffer.save();
        if(result){
            req.session.referralOfferAdded = true
            res.redirect('/add-referralOffer');
        }
        
      }catch(error) {
        console.error('Error adding referral offer:', error);
        res.status(500).send('Internal Server Error');
      }
    },
  };


// update referral offer - POST
const updateReferralOffer = {
  async editOffer(req, res) {
    try {
      req.session.referralOfferUpdated = true;
      const { referralAmount, referredUserReward, expDate, id } = req.body;
      const trimmedReferralAmount = referralAmount.trim();
      const trimmedReferredUserReward = referredUserReward.trim();
      
      if (!/\d{1,}/.test(trimmedReferralAmount)) {
          req.session.invalidReferralAmount = true;
          console.log('referral Amount should contain at least 1 numbers');
          res.redirect('/add-referralOffer');
          return;
      }
      
      if (!/^(?:\d*\.)?\d+$/.test(trimmedReferralAmount)) {
          console.log('Please provide non-negative values as referral amount.');
          req.session.negativeReferralAmount = true;
          res.redirect('/add-referralOffer');
          return;
      }
      
      if (!/\d{2,}/.test(trimmedReferredUserReward)) {
          req.session.invalidUserReward = true;
          console.log('user Reward should contain at least 1 numbers');
          res.redirect('/add-referralOffer');
          return;
      }
      
      if (!/^(?:\d*\.)?\d+$/.test(trimmedReferredUserReward)) {
          console.log('Please provide non-negative values for Referred User Reward.');
          req.session.negativeUserReward = true;
          res.redirect('/add-referralOffer');
          return;
      }

      const newData = {
        referralAmount : trimmedReferralAmount,
        referredUserReward : trimmedReferredUserReward,
        expDate: expDate
        }

      const result = await referralOfferDB.findOneAndUpdate({_id : id}, {$set: newData }, {new: true});
      if(result.modifiedCount === 0){
        console.log("referral offer not updated");
        res.status(200).json({ success: false, message: "Referral offer not updated" });
      }else{
        console.log("referral offer updated");
        req.session.referralOfferUpdated = true;
        res.status(200).json({ success: true });
      }
    }catch(error) {
      console.error('Error adding referral offer:', error);
      res.status(500).send('Internal Server Error');
    }
  },
};


// delete referral offer - POST
const deleteReferralOffer = {
  async removeOffer(req, res) {
    try{
      const { id } = req.params;
      req.session.referralOfferDeleted = false;
      const result = await referralOfferDB.deleteOne({_id:id});
        if (result.modifiedCount === 0) {
            console.log('No offer(category-offer) found with the provided ID');
            req.session.referrelfferDeletionError = 'referral offer not found with the provided id';
            res.status(200).json({ success: false, message: "Referral offer not deleted" });
        } else {
            console.log('referral offer removed');
            req.session.referralOfferDeleted = true;
            res.status(200).json({ success: true });
        }
    }catch(error) {
      console.error('Error deleting referral offer:', error);
      res.status(500).send('Internal Server Error');
    }
  },
};


module.exports = {addReferralOffer, updateReferralOffer, deleteReferralOffer}