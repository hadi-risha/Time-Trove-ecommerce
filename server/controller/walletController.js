const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const walletDB = require("../model/walletModel")


// final-products - POST
const walletAddMoney = {
    async addMoney(req, res) {        
      try{
        console.log("in backend.........add money section");
        console.log(req.body);
        console.log(req.body.amount);
        const walletAmount = req.body.amount

        // if(walletAmount){

            var instance = new Razorpay({
              key_id: 'rzp_test_FFleULTlFE3GDB',
              key_secret: 'K0ewvhB5fi7BrEllAxgfWdrp',
            });

            //razorpay utils
            function generateSignature(data, secret) {
              return crypto.createHmac('sha256', secret).update(data).digest('hex');
            }

            // create an order with Razorpay
            console.log(walletAmount);
            var options = {
              amount: walletAmount * 100, //amount in the smallest currency unit 
              currency: "INR",
              receipt: "rcp1", //custom receipt ID
              payment_capture: 1 //auto capture the payment
            };

            const order = await instance.orders.create(options);

            res.status(200).json({
              success:true,
              walletAmount,
              order
            });

        // }

        // res.json({
        //   success: "money added",
        //   walletAmount: walletAmount,
        // });
        
      } catch (error) {
        console.error('Error adding money to wallet:', error);
        res.status(500).json('Internal Server Error');
      }
    },
  };
  

  
  
// wallet verifyPayment - POST
const verifyWalletPayment = {
  async razorpayPayment(req, res) {
    try {
      const { orderId, paymentId, signature, walletAmount } = req.body;
      console.log("asdfghj..", orderId, paymentId, signature);
      const secret = 'K0ewvhB5fi7BrEllAxgfWdrp';

      const generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(orderId + "|" + paymentId)
        .digest("hex");



        console.log("its also coming in the payment verification section of wallet-------------------------------");
        console.log("wallet amount-------------------------------",req.body);
      if(generatedSignature === signature) {
        console.log("inside of if condition........-------------------------------");
          const wallet = await walletDB.findOneAndUpdate({email: req.session.userEmail}, {$inc:{balance: walletAmount},
          $push: { transactions: {
                    amount: walletAmount,
                    action: "credit"
                  },},
              },{ new: true, upsert: true });

          if(wallet.modifiedCount === 0) {
            console.log('Payment  status could not be updated.');
            res.send({ success: false, message: 'Payment  status could not be updated.' });
          }else{
            console.log('Payment verified and updated successfully.');
            res.send({ success: true, message: 'Payment verified and updated successfully.' });
          }
      }else{
          res.send({ success: false, message: 'Payment verification failed.' });
      }
    } catch (err) {
      console.log(err);
    }
  },
};


module.exports = { walletAddMoney, verifyWalletPayment }