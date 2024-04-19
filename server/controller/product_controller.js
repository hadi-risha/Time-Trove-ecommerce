const productDB = require("../model/productModel");
const shoppingCartDB = require("../model/shoppingCartModel");
const Orderdb = require("../model/orderModel");
const AddressDB = require("../model/address-model");
const wishlistDB = require('../model/wishlistModel')
const walletDB = require('../model/walletModel')
const mongoose = require('mongoose');



const Razorpay = require('razorpay');
const crypto = require('crypto');
const couponDB = require("../model/couponModel");
const { log } = require("util");

//razorpay
var instance = new Razorpay({
  key_id: 'rzp_test_FFleULTlFE3GDB',
  key_secret: 'K0ewvhB5fi7BrEllAxgfWdrp',
});


// search for products - POST
const searchProduct = {
  async findProduct(req, res) {
    try {
      const query = req.query.q;
        if (!query) {
            return res.status(400).send({ error: 'Query parameter is missing' });
        }

        //perform the search
        const products = await productDB.find({
            $or: [
                { productName: { $regex: query, $options: 'i' } },
                { productDescription: { $regex: query, $options: 'i' } },
                { category: { $regex: query, $options: 'i' } }
            ]
        });

        res.send(products);
    } catch (error) {
      console.error('Error adding product to cart : ', error);
      res.status(500).send('Internal Server Error');
    }
  },
};


// shopping-cart - POST
const shoppingCart = {
  async userCart(req, res) {
    try {
      const { id } = req.body;
      const { userEmail } = req.session;
      console.log("this is comingggggggggggggggg,,", id);

      const newCartDetails = new shoppingCartDB({ email: userEmail, productId: id });
      //save new cartDetails in mongodb
      await newCartDetails.save();

      res.redirect(`/single-product/${id}`);
    } catch (error) {
      console.error('Error adding product to cart : ', error);
      res.status(500).send('Internal Server Error');
    }
  },
};


// cartQty - POST
const cartQty = {
  async addItem(req, res) {
    try {
      const { productId, quantity, totalPrice, totalDiscount} = req.body;
      console.log('New user neede qty--', quantity);
      console.log('id of product/cart data(_id of product in shoppingCart db)',productId);

      // testing
      console.log('id of product/cart data(_id of product in shoppingCart db)',productId);
      const findCartData = await shoppingCartDB.findOne({_id:productId})
      console.log('real productId(from productDb',(findCartData.productId))
      const actualProductId = findCartData.productId;

      const productOgDetails = await productDB.findOne({_id : actualProductId})
      const availableQty = productOgDetails.quantity;
      const productPrice = productOgDetails.lastPrice;
      const discountInPercentage = productOgDetails.discount;
      // if( availableQty === 0){
      //   return res.json({ error: 'Product Out Of Stock' });
      // }
      if (availableQty > 0 && quantity > availableQty) {
        console.log('Product Quantity limit exceeded.');
        return res.json({ error: 'Product Quantity limit exceeded.', details: 'Product Quantity limit exceeded.' });
     }

    

      const { userEmail } = req.session;
      await shoppingCartDB.updateOne({ $and: [{ _id: productId }, { email: userEmail }] }, { $set: { userAddedQuantity: quantity } }, { upsert: true });
      console.log('Quantity updated successfully');


      res.json({
        success: "proceed to address page",           
        showMessage: 'Proceed',
        // finalPrice,
        // finalDiscount
      });
     

      
    } catch (error) {
      console.error('Error updating cart qty :', error);
      res.status(500).send('Internal Server Error');
    }
  },
};


// remove-item - POST
const removeItem = {
  async moveFromCart(req, res) {
    try {
      const { id } = req.body;

      const result = await productDB.findOneAndUpdate({ _id: id }, { $set: { addToBag: false } }, { new: true })
      if (result) {
        console.log("success,Product removed from cart");
        console.log('addToBag result should be false', result);
      } else {
        console.log('product still in the cart,not removed');
      }

      const removeCartDB = await shoppingCartDB.deleteOne({ productId: id });
      if (removeCartDB.deletedCount === 1) {
        console.log('Document removed successfully');
      } else {
        console.log('Document not found or not removed');
      }

      res.redirect('/shopping-cart');
    } catch (error) {
      console.error('Error removing product from cart : ', error);
      res.status(500).send('Internal Server Error');
    }
  },
};


// proceed-payment - POST
const productPayment = {
  async proceedtoPayment(req, res) {
    try {
      console.log("data : ", req.body);
    } catch (error) {
      console.error('Error in productPayment :', error);
      res.status(500).send('Internal Server Error');
    }
  },
};


// delivery-address - POST
const deliveryAddress = {
  selectedAddress(req, res) {
    try {
      const { selectedAddressId } = req.body;
      req.session.selectedAddressId = selectedAddressId;
      console.log("selected address id (from deliveryAddress form)", selectedAddressId);

      res.redirect('/checkout-paymentMode"');
    } catch (error) {
      console.error('Error adding product to wishlist:', error);
      res.status(500).send('Internal Server Error');
    }
  },
};


// add-checkoutAddress - POST
const checkoutNewAddress = {
  async newAddress(req, res) {
    try {
      //create a new address
      const { pincode, state, address, district, mobile } = req.body;

      const trimmedPincode = pincode.trim();
      const trimmedState = state.trim();
      const trimmedAddress = address.trim();
      const trimmedDistrict = district.trim();
      const trimmedMobile = mobile.trim();

      //validate pincode
      if (!/^\d{6}$/.test(trimmedPincode)) {
        console.log("Invalid PIN code. Please enter a 6-digit numeric PIN code");
        req.session.checkoutAddressInvalidPin = true;
        res.redirect('/checkout-addAddress');
        return;
      }

      if (trimmedState === '') {
        req.session.checkoutAddressNotvalidState = true;
        console.log('state is empty,field required');
        res.redirect('/checkout-addAddress');
        return;
      }

      if (!/^[A-Za-z\s]+$/.test(trimmedState)) {
        console.log('Invalid state name,Please use only letters and spaces');
        req.session.checkoutAddressInvalidState = true;
        res.redirect('/checkout-addAddress');
        return;
      }

      if (trimmedAddress === '') {
        req.session.checkoutAddressInvalidAddress = true;
        console.log('adress is empty,field required');
        res.redirect('/checkout-addAddress');
        return;
      }

      if (trimmedDistrict === '') {
        req.session.checkoutAddressNotnvalidDistrict = true;
        console.log('district is empty,field required');
        res.redirect('/checkout-addAddress');
        return;
      }

      if (!/^[A-Za-z\s]+$/.test(trimmedDistrict)) {
        console.log('Invalid district name,Please use only letters and spaces');
        req.session.checkoutAddressInvalidDistrict = true;
        res.redirect('/checkout-addAddress');
        return;
      }

      if (!/^\d{10}$/.test(mobile)) {
        req.session.invalidMobile = true;
        console.log('mobile number not included 10 digits');
        res.redirect('/checkout-addAddress');
        return;
      }


      const { userEmail } = req.session;
      const newAddress = new AddressDB({
        pincode: trimmedPincode,
        state: trimmedState,
        address: trimmedAddress,
        district: trimmedDistrict,
        mobile: trimmedMobile,
        addressType: req.body['address-type'],
        email: userEmail
      });
      console.log('new address before save in mongodb', newAddress);

      const result = await newAddress.save();
      console.log("address:", result);
      if (result) {
        console.log('new address saved');
        req.session.addressSaved = true;
        res.redirect('/checkout-address')
      }
    } catch (err) {
      console.log('address error', err);
      res.send('Internal server err');
    }
  },
};


//edit-checkoutAddress - POST
const checkoutUpdateAddress = {
  async updateAddress(req, res) {
    try {
      const { id } = req.body;
      console.log('address id : ', id);
      const currentAddress = await AddressDB.findOne({ _id: id })
      console.log('address details before updation', currentAddress);

      req.session.currentAddressDetails = currentAddress;

      const { pincode, state, address, district, mobile, addressType } = req.body;
      const trimmedPincode = pincode.trim();
      const trimmedState = state.trim();
      const trimmedAddress = address.trim();
      const trimmedDistrict = district.trim();
      const trimmedPMobile = mobile.trim();
      const trimmedAddressType = addressType.trim();

      //validate pincode
      if (!/^\d{6}$/.test(trimmedPincode)) {
        console.log("Invalid PIN code. Please enter a 6-digit numeric PIN code");
        req.session.checkoutAddressInvalidPin = true;
        res.redirect(`/checkout-editAddress/${id}`);    
        return;
      }

      if (trimmedState === '') {
        req.session.checkoutAddressNotvalidState = true;
        console.log('state is empty,field required');
        res.redirect(`/checkout-editAddress/${id}`);
        return;
      }

      if (!/^[A-Za-z\s]+$/.test(trimmedState)) {
        console.log('Invalid state name,Please use only letters and spaces');
        req.session.checkoutAddressInvalidState = true;
        res.redirect(`/checkout-editAddress/${id}`);
        return;
      }

      if (trimmedAddress === '') {
        req.session.checkoutAddressInvalidAddress = true;
        console.log('adress is empty,field required');
        res.redirect(`/checkout-editAddress/${id}`);
        return;
      }

      if (trimmedDistrict === '') {
        req.session.checkoutAddressNotnvalidDistrict = true;
        console.log('district is empty,field required');
        res.redirect(`/checkout-editAddress/${id}`);
        return;
      }

      if (!/^[A-Za-z\s]+$/.test(trimmedDistrict)) {
        console.log('Invalid district name,Please use only letters and spaces');
        req.session.checkoutAddressInvalidDistrict = true;
        res.redirect(`/checkout-editAddress/${id}`);
        return;
      }

      if (!/^\d{10}$/.test(mobile)) {
        req.session.invalidMobile = true;
        console.log('mobile number not included 10 digits');
        res.redirect(`/checkout-editAddress/${id}`);
        return;
      }

      const newData = {
        pincode: trimmedPincode,
        state: trimmedState,
        address: trimmedAddress,
        district: trimmedDistrict,
        mobile: trimmedPMobile,
        addressType: trimmedAddressType
      }

      const updatedAddress = await AddressDB.updateOne({ _id: id }, { $set: newData }, { new: true, useFindAndModify: false });
        if (updatedAddress) {
          console.log('new address details after updation', updatedAddress);
          console.log("Address Updated successfully");
          req.session.updatedAddress = true
          res.redirect('/checkout-address');
        } else {
          console.log("address not found or not updated");
        }
    }catch (error) {
      console.error('Error while editing address', error);
      res.status(500).send('Internal Server Error');
    }
  },
};


// delete-CheckoutAddress - POST
const deleteCheckoutAddress = {
  async removeAddress(req, res) {
    try {
      const { id } = req.body;
      console.log('address Id', id);

      const removedAddress = await AddressDB.findOneAndDelete({ _id: id });
      if (removedAddress) {
        console.log("checkout Address Deleted successfully");
        res.redirect('/checkout-address');
      } else {
        console.log("checkout address not found or not updated");
      }
    } catch (error) {
      console.error('Error while deleting address', error);
      res.status(500).send('Internal Server Error');
    }
  },
};


//apply and remove couponCode in CheckoutAddress - POST
const CouponApply = {
  async applyAndRemoveCoupon(req, res) {
     try{
        req.session.discountAmountInNumber = 0;
        console.log('body...',req.body);
        req.session.couponDiscountApplied = false;

        if(req.body.totalPrice && req.body.q){   //if block,because in remove case these data will not send to here
            req.session.OldTotalPrice = req.body.totalPrice;
            req.session.usedCouponCode = req.body.q;
        }
       
       console.log('bool string value---',req.body.cpnApplyNotRemoveRequest);  //constant val in both case,to check which block should execute

       const {cpnApplyNotRemoveRequest} = req.body;
          if(cpnApplyNotRemoveRequest === 'true'){

            const {q, totalPrice } = req.body;   //q - coupon code

            req.session.newTotalPrice = totalPrice;
            req.session.ogTotalPriceBeforeCouponDiscount = totalPrice;   // with this track og price and apply the coupon price accordingly in order section
       
            req.session.couponCode = null;

            const caps = q.toUpperCase();
            const data = await couponDB.findOne({couponCode: caps});  //check coupon exist or not

            // console.log("coupoApplyNotRemoveRequest===", req.body.cpnApplyNotRemoveRequest);  //it will be boolean

              if(!data){
                return res.json({error: 'invalid coupon code'});
              }
              
              console.log(totalPrice , data.useAbove);
              if(totalPrice < data.useAbove){
                return res.json({error: 'Price criteria not met'});
              }

              
              const {userEmail} = req.session;
              //check if the user has already used the coupon
              // const existingUser = await couponDB.findOne({couponCode: caps, "usedUsers.email": userEmail });
              // if(existingUser){
              //   return res.json({error: 'User coupon already used.'});
              // }

              // add user email in coupon email-field and decrease maxUse value by 1
              const result = await couponDB.findOneAndUpdate({ couponCode: caps }, 
                            { $push: { usedUsers: { email: userEmail } } ,$inc:{maxUses : -1}}, { new: true } // Return the updated document
                            );
                  if (result) {
                      console.log("added the user email to the email field and decreased the maxUses field", result);
                  } else {
                      console.log("not deacresed the maxUse value and not Added user email to the email field");
                  }

              const discount = data.discount;
              const discountAmountInNumber = (totalPrice * discount)/ 100

              req.session.discountAmountInNumber = discountAmountInNumber //0 

              const newTotalPrice = Math.ceil(totalPrice - discountAmountInNumber);
              req.session.couponDiscountApplied = true;           //used to track the state and render the value while reload the page of checkout address

              req.session.couponCode = caps;
              req.session.totalPriceAfterCouponDiscount = newTotalPrice ;

              res.json({
                success: "Coupon applied",
                newTotalPrice: newTotalPrice,
                discountAmountInNumber
              });
          }else{    
              console.log("coupon remove section");
              console.log('old total price', req.session.OldTotalPrice);
              console.log('old coupon code from if case',req.session.usedCouponCode);   //use this code to find the discount (and increment with the current prize or directly access the oldprice session)

              req.session.couponDiscountApplied = false;           //used to track the state and render the value while reload the page of checkout address

              const {userEmail} = req.session;

              // reset both session to get correct price when remove coupon codes
              // req.session.totalPriceAfterCouponDiscount = req.session.ogTotalPriceBeforeCouponDiscount;
              req.session.totalPriceAfterCouponDiscount = req.session.OldTotalPrice
              req.session.discountAmountInNumber = 0;  //coupon discount

              //remove email in coupon email-field and increase maxUse value by 1
              const result = await couponDB.findOneAndUpdate({ couponCode: req.session.couponCode }, 
                { $pull: { usedUsers: { email : userEmail } } ,$inc:{maxUses : 1 }}, { new : true } // Return the updated document
                          );
                if (result) {
                    console.log("removed the user email from usedUsers array and increased the maxUses field by 1", result);
                } else {
                    console.log("failed to remove the user email from usedUsers array and/or increase the maxUses field.");
                }

              res.json({
                success: "Coupon removed",
                OldTotalPrice : req.session.OldTotalPrice,     //og total price
              });
          }

        
     }catch(err){
       console.log(err);
     }
  },
 };




// selectedPaymentType - POST
const paymentType = {
  async paymentMode(req, res) {
    try {
      req.session.walletAmount = null
      req.session.remainingBalanceInWallet = null
      req.session.remainingBalancetoPay = null;
      req.session.totalOrderPriceFromWallet = null
      req.session.firstAmountThoroughWallet = null

      console.log("this will come only if coupon applied, req.session.totalPriceAfterCouponDiscount", req.session.totalPriceAfterCouponDiscount);
      console.log('final amount in paymentmethod page------------------', req.body.finalAmountInPayment);

      




      // ******************* testing *****************
      //get shopping cart section
      const {userEmail} = req.session;
      const cartProductDetails = await shoppingCartDB.aggregate([
          {
              $match: {
                  email: userEmail
              }
          },
          {
              '$lookup': {
                  'from': 'productdbs',
                  'localField': 'productId',
                  'foreignField': '_id',
                  'as': 'pDetails'
              }
          }
      ]);



      
      
      // ******************* /calculate total price *****************
      let totalFinalPrice = 0;
      if(cartProductDetails && cartProductDetails.length > 0) {
          console.log('Cart product details found:');
          cartProductDetails.forEach(item => {
              const productDetails = item.pDetails[0]; 
              if(productDetails) {
                  console.log('Product Name:', productDetails.productName);
                  console.log('Category:', productDetails.category);
                  console.log('First Price:', productDetails.firstPrice);
                  console.log('Last Price:', productDetails.lastPrice);
                  console.log('Discount:', productDetails.discount);
                  console.log('Quantity:', productDetails.quantity);
                  console.log('Product Offer Discount:', productDetails.productofferDiscount);
                  console.log('Category Offer Discount:', productDetails.categoryofferDiscount);
                  console.log('-----------------------------');
              }else{
                console.log('No product details found for this item.');
              }

              // first price
              let totalFPrice = 0;
              cartProductDetails.forEach(item => {
                  const productDetails = item.pDetails[0]; 
                  totalFPrice += parseFloat(productDetails.firstPrice) * item.userAddedQuantity;
              })
              // /first price

              // discount
              let totalDiscount = 0
              cartProductDetails.forEach(item => {
                  const productDetails = item.pDetails[0]; 

                  let discountPercentage = 0
                  if(productDetails.productofferDiscount &&  productDetails.categoryofferDiscount){
                    let finalizeDiscount = productDetails.productofferDiscount > productDetails.categoryofferDiscount ? productDetails.productofferDiscount : productDetails.categoryofferDiscount;
                    discountPercentage = productDetails.discount + finalizeDiscount
                  }else if(productDetails.productofferDiscount){
                    discountPercentage = productDetails.discount + productDetails.productofferDiscount
                  }else if(productDetails.categoryofferDiscount){
                    discountPercentage = productDetails.discount + productDetails.categoryofferDiscount
                  }else{
                    discountPercentage = productDetails.discount
                  }

                  let discInNum = (productDetails.firstPrice * discountPercentage) /100
                  let prdctPrice = productDetails.firstPrice - discInNum 
                  
                  const prdcttPricefirst = productDetails.firstPrice 
                  const productQty = item.userAddedQuantity;

                  const productDiscntt = ((prdcttPricefirst - prdctPrice) * item.userAddedQuantity) 
                  totalDiscount += productDiscntt;
                  totalDiscount = Math.trunc(totalDiscount) 
              })
              // /discount

              // lastprice
              // let totalFinalPrice = 0;
              cartProductDetails.forEach(item => {
                  const productDetails = item.pDetails[0]; 
                  let {discountAmountInNumber } = req.session;
                  (productDetails.firstPrice * item.userAddedQuantity)  - totalDiscount;
                  totalFinalPrice = Math.round(discountAmountInNumber? (totalFPrice - totalDiscount) - discountAmountInNumber : (totalFPrice - totalDiscount) )

                  console.log("final price...", totalFinalPrice)
              })
              // /lastprice
  
          });
      }else{
          console.log('No cart product details found.');
      }
      // ******************* /calculate total price *****************

      let { paymentType } = req.body;
      req.session.selectedPaymentType = paymentType;
      console.log('selected payment type.....................',paymentType);
      const paymentMethod = req.session.selectedPaymentType;
      req.session.selectedPaymentMethod = paymentType;


      let buyWithWallet = false;
     let buyWithWalletAndRazorpay = false
      if(paymentType === 'wallet'){
          const walletData = await walletDB.findOne({email : userEmail})
          if(!walletData){
            console.log('user wallet not exist');
            return res.json({error: 'Insufficient funds in wallet. Please select another payment method.'});
          }
          if(walletData.balance === 0 ){
            console.log('Insufficient funds in wallet. Please select another payment method.');
          }
          req.session.walletAmount = walletData.balance
          
          
          let remainingBalanceInWallet = 0
          if(walletData.balance >= totalFinalPrice){
            console.log('user can fully buy product with wallet');
            buyWithWallet = true   //if its true show only wallet option
            remainingBalanceInWallet = walletData.balance - totalFinalPrice   // remaining bal should be this in wallet(update wallet)
            req.session.remainingBalanceInWallet = remainingBalanceInWallet;
          }else{
            buyWithWalletAndRazorpay = true   //if its true show both wallet and razorpay option (and in razorpay amount show the remaining price)
            remainingBalanceInWallet = 0.00;
            req.session.remainingBalanceInWallet = remainingBalanceInWallet;

            const remainingBalancetoPay = totalFinalPrice - walletData.balance    // remaining bal
            req.session.firstAmountThoroughWallet = totalFinalPrice - remainingBalancetoPay;
            console.log("1st payed amount through wallet", req.session.firstAmountThoroughWallet);
            req.session.remainingBalancetoPay = remainingBalancetoPay;
            console.log("remainingBalancetoPay", req.session.remainingBalancetoPay);     //it will be 11 something
            console.log('user need to pay remaining balance with razorpay option');
          }
          remainingBalanceInWallet = req.session.remainingBalanceInWallet;
          
      }



      console.log(buyWithWallet);
      console.log(buyWithWalletAndRazorpay);

      let walletAmount = req.session.walletAmount;
      let remaininggBalanceInWallet = req.session.remainingBalanceInWallet
      let remainingBalancetoPay = req.session.remainingBalancetoPay;
      let totalOrderPrice = totalFinalPrice;

      req.session.totalOrderPriceFromWallet = totalFinalPrice;
      console.log('walletAmount',walletAmount);
      console.log('remaininggBalanceInWallet',remaininggBalanceInWallet);
      console.log('remainingBalancetoPay',remainingBalancetoPay);
      console.log('totalOrderPrice',totalOrderPrice);

      let codNotApplicable = false;
      if( totalOrderPrice > 1000 &&  paymentType === 'cod' ){
        console.log("user can't order,cash on delivery only for orders under rs 1000");
        // req.session.codBelowThousand = true;
        codNotApplicable = true;
        // return res.redirect('/checkout-paymentMode?error=codAbove1000');
        console.log('whats hereeeeeeee',req.session.codNotApplicable);
        // return res.redirect('/checkout-paymentMode');   //pass error parameter
      }


      req.session.payedAmountThoroughWallet = req.session.firstAmountThoroughWallet || totalFinalPrice
      
      


      res.json({ success: true, paymentMethod, buyWithWallet, buyWithWalletAndRazorpay, walletAmount, remainingBalancetoPay,
                  totalOrderPrice, remaininggBalanceInWallet, codNotApplicable })
    }catch(error) {
      console.error('Error accessing payment type', error);
      res.status(500).send('Internal Server Error');
    }
  },
};



// final-products - POST
const finalpData = {
  async orderedProducts(req, res) {        
    try {
      console.log('wallet, payedAmountThoroughWallet , remainingBalancetoPay ',req.session.payedAmountThoroughWallet, req.session.remainingBalancetoPay );
      console.log('total order price from wallet, ',req.session.totalOrderPriceFromWallet );
      
      console.log('1 this is from coupon section totalPriceAfterCouponDiscount', req.session.totalPriceAfterCouponDiscount);   //this is coupon applied total price
      console.log('2 og price from totalPrice column of paymentpage',req.body.testingTotalPrice);    //og price comes frob body

      console.log('3 in razorpay this will give proper final amount',req.body.amount);
      


      const SelectedPaymentType = req.session.selectedPaymentMethod;
      console.log('',SelectedPaymentType);
      // if ttl amnt above 1000 and cod , user cannot order
      const price = req.body.amount || req.body.testingTotalPrice
      const paymType = SelectedPaymentType || 'cod'
      req.session.codNotApplicable = false;
      console.log('whats hereeeeeeee',req.session.codNotApplicable);
      if((req.body.amount || req.body.testingTotalPrice) > 1000 &&  paymType === 'cod' ){
        console.log("user can't order,cash on delivery only for orders under rs 1000");
        req.session.codBelowThousand = true;
        // req.session.codNotApplicable = true;
        // return res.redirect('/checkout-paymentMode?error=codAbove1000');
        console.log('whats hereeeeeeee',req.session.codNotApplicable);
        return res.redirect('/checkout-paymentMode');   //pass error parameter
      }
      const result = await shoppingCartDB.find({ _id: { $in: req.body.productId } });
      if (result) {
        const productIds = result.map(item => item.productId);

        const userQtyMap = new Map(result.map((item) => [item.productId.toString(), item.userAddedQuantity]));

        const UserQty = result.map(qty => qty.userAddedQuantity);

        const data = await productDB.find({ _id: { $in: productIds } });

        const orderItems = data.map(product => ({
          productId: product._id,
          pName: product.productName,
          pDescription: product.productDescription,
          quantity: product.quantity,
          userAddedQty: userQtyMap.get(product._id.toString()),
          firstPrice: product.firstPrice,
          lastPrice: product.lastPrice,
          discount : product.discount,
          images: product.images.map(image => image.replace('/uploads/', '/')),
          category: product.category,
          productofferDiscount : product.productofferDiscount || null,
          categoryofferDiscount : product.categoryofferDiscount || null
        }));

        

        const selectedAddressDetails = await AddressDB.findOne({ _id: req.session.selectedAddressId })
        const { pincode, state, address, district, mobile, addressType } = selectedAddressDetails;


        console.log('in cod this will give proper final amount',req.body.testingTotalPrice);
        console.log('in razorpay this will give proper final amount',req.body.amount);

        let newOrder = new Orderdb({
          email: req.session.userEmail,
          orderItems: orderItems,
          userAddedQty: UserQty[0],               
          finalAmount: req.session.payedAmountThoroughWallet || req.body.testingTotalPrice ||  Math.round(req.body.amount) || req.session.totalPriceAfterCouponDiscount ,
          balanceToPay :  req.session.remainingBalancetoPay ?  req.session.remainingBalancetoPay : 0 ,
          paymentMethod: SelectedPaymentType || 'cod',
          selectedAddress: [{ pincode, state, address, district, mobile, addressType }]
        });

        const newOrderData = await newOrder.save();
        req.session.discountAmountInNumber = 0;     //reset session to avoi conflict in next order,it will take coupon value in all orde after order set as 0 
        req.session.selectedPaymentMethod = null;
        req.session.totalPriceAfterCouponDiscount = 0;
        console.log('full data',newOrderData,'new order _id',newOrderData._id );
        req.session.newOrderId = newOrderData._id;
        console.log(req.session.newOrderId);
        console.log('newOrderData.balanceToPay88888888888888888888888888888888',newOrderData.balanceToPay);

        //clear shoping cart once place order
        if (newOrderData) {
          const result = await shoppingCartDB.deleteMany({ _id: { $in: req.body.productId } });

          if(result.deletedCount === 0) {
            console.log('no documents were deleted.');
          }else{
            console.log(`${result.deletedCount} data/document were deleted from shoping cart.`);

            //reduce quantity(in productDB) based on useraddedQuantity        
            const updateOperations = productIds.map(productId => ({
              updateOne: {
                filter: { _id: productId },
                update: { $inc: { quantity: -1 * userQtyMap.get(productId.toString()) } },
              },
            }));
            await productDB.bulkWrite(updateOperations);
            console.log('Product quantities updated successfully.');

          }
        }
        if (newOrderData.paymentMethod == 'cod') {
            return res.status(200).json({
              success: true,
              paymentMethod: newOrderData.paymentMethod,
              url: '/order-placed'
            });
        } else if (newOrderData.paymentMethod == 'razorpay') {

          console.log('when razorpay........this will give the proper price: ', req.session.totalPriceAfterCouponDiscount);
          console.log('current ttl price amnts ', req.body.testingTotalPrice );
          var instance = new Razorpay({
            key_id: 'rzp_test_FFleULTlFE3GDB',
            key_secret: 'K0ewvhB5fi7BrEllAxgfWdrp',
          });

          //razorpay utils
          function generateSignature(data, secret) {
            return crypto.createHmac('sha256', secret).update(data).digest('hex');
          }

          // create an order with Razorpay
          console.log(req.body.amount);
          var options = {
            amount: Math.round(req.session.remainingBalancetoPay || req.body.testingTotalPrice ||  Math.round(req.body.amount) || req.session.totalPriceAfterCouponDiscount) * 100, //amount in the smallest currency unit 
            currency: "INR",
            receipt: "rcp1", //custom receipt ID
            payment_capture: 1 //auto capture the payment
          };

          const order = await instance.orders.create(options);

          res.status(200).json({
            success:true,
            paymentMethod:newOrderData.paymentMethod,
            order
          });

        }else if(newOrderData.paymentMethod == 'wallet' && newOrderData.balanceToPay === 0){
            console.log("final data----------------------------wallet section");
            console.log(newOrderData.finalAmount);
            
            let decrementPrice = await walletDB.findOneAndUpdate({email:  req.session.userEmail}, {$inc: {balance: -newOrderData.finalAmount},
              $push: { transactions: {
                amount: newOrderData.finalAmount,
                action: "debit"}}}, { new:true } );

            if( decrementPrice.modifiedCountCount > 0 ){
              console.log("order price decremented and history added in wallet");

            }else{
              console.log("order price not decremented and transaction history not added");
            }

            updatePaymentStatus = await Orderdb.findOneAndUpdate({_id:newOrderData._id}, {$set: {paymentstatus: "completed"}}, {new: true});
            if( updatePaymentStatus.updatedCount > 0 ){
              console.log("payment status updated in orderdb(wallet case)");
            }else{
              console.log("payment status not updated in orderdb(wallet case)");
            }



            return res.status(200).json({
              success: true,
              paymentMethod: newOrderData.paymentMethod,
              noBalanceToPay : true,
              url: '/order-placed'
            });
        }else if(newOrderData.paymentMethod == 'wallet' && newOrderData.balanceToPay > 0) {

            // implement razorpay with the remainin balance
            console.log('this will give the correct payed balance throgh wallet',req.session.payedAmountThoroughWallet);
            console.log('this will give the correct remaining balance of the order, balance to pay through razorpay', req.session.remainingBalancetoPay);

            console.log('in this case complete existing money in wallet used , so set as 0');
            // const reduceWalletMoney = await walletDB.findOneAndUpdate({email: req.session.userEmail}, {$set:{balance: 0 }})

            const reduceWalletMoney = await walletDB.findOneAndUpdate({email: req.session.userEmail}, {$set:{balance: 0 },
              $push: { transactions: {
                amount: req.session.payedAmountThoroughWallet,
                action: "debit"}}}, { new:true } );
            // if(reduceWalletMoney.modifiedCount > 0){
            //   console.log("transaction history added and balance set to 0");
            // }else{
            //   console.log("transaction history not added and balance doesn't set to 0");
            // }
            


          



            var instance = new Razorpay({
              key_id: 'rzp_test_FFleULTlFE3GDB',
              key_secret: 'K0ewvhB5fi7BrEllAxgfWdrp',
            });

            //razorpay utils
            function generateSignature(data, secret) {
              return crypto.createHmac('sha256', secret).update(data).digest('hex');
            }

            // create an order with Razorpay
            var options = {
              amount: Math.round(req.session.remainingBalancetoPay || req.body.testingTotalPrice ||  Math.round(req.body.amount) || req.session.totalPriceAfterCouponDiscount) * 100, //amount in the smallest currency unit 
              currency: "INR",
              receipt: "rcp1", //custom receipt ID
              payment_capture: 1 //auto capture the payment
            };

            const order = await instance.orders.create(options);

            res.status(200).json({
              success:true,
              paymentMethod:newOrderData.paymentMethod,
              balanceToPay : true,
              orderId: newOrderData._id,
              order
            });


        } 
        req.session.remainingBalancetoPay = null
      }else{
        console.log("nothing in shopping cart, removed all the products,so cannot place order!!!!");
        res.json({url: '/shopping-cart'});
      }
    } catch (error) {
      console.error('Error adding final product to orderDB:', error);
      res.status(500).json('Internal Server Error');
    }
  },
};

// razorpay createOrderId - POST
const createOrderId = {
  orderId(req, res) {
    var options = {
      amount: req.body.amount,
      currency: "INR",
      receipt: "rcp1"
    };
    instance.orders.create(options, function (err, order) {
      if (err) {
        console.error(err);
        return res.status(500).send({ error: "Internal Server Error" });
      }
      console.log(order);
      res.send({ orderId: order.id });
    });
  },
};


// razorpay verifyPayment - POST
const verifyPayment = {
  async razorpayPayment(req, res) {
    try {
      const { orderId, paymentId, signature } = req.body;
      console.log("asdfghj..", orderId, paymentId, signature);
      const secret = 'K0ewvhB5fi7BrEllAxgfWdrp';

      const generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(orderId + "|" + paymentId)
        .digest("hex");

      if(generatedSignature === signature) {
          const result = await Orderdb.updateOne({_id:req.session.newOrderId, email: req.session.userEmail}, { $set:{ paymentstatus:'completed' }});
          // res.send({ success: true, message: 'Payment verified successfully.' });
          if(result.modifiedCount > 0) {
            res.send({ success: true, message: 'Payment verified and updated successfully.' });
          }else{
            res.send({ success: false, message: 'Payment  status could not be updated.' });
          }
      }else if(generatedSignature === signature && paymentCompletedUsingWallet){
        const result = await Orderdb.updateOne({_id:req.session.newOrderId, email: req.session.userEmail}, { $set:{ paymentstatus:'completed' }});
          // res.send({ success: true, message: 'Payment verified successfully.' });
          if(result.modifiedCount > 0) {
            res.send({ success: true, message: 'Payment verified and updated successfully.' });
          }else{
            res.send({ success: false, message: 'Payment  status could not be updated.' });
          }
      }else{
          res.send({ success: false, message: 'Payment verification failed.' });
      }
    } catch (err) {
      console.log(err);
    }
  },
};



// razorpay verifyPayment - POST
const verifyPaymentOfWallet = {
  async razorpayPayment(req, res) {
    try {
console.log("wallet amount decrease here0000000000000000000000000000");
      console.log("its came hereeeeeeee for verification-----------------------oo");

      console.log("og order id------------------", req.body.ogOrderId);
      console.log("its here    :),,,,,,,,,", req.body);
      const { orderId, paymentId, signature, paymentCompletedUsingWallet , ogOrderId} = req.body;
      console.log("asdfghj..", orderId, paymentId, signature);
      const secret = 'K0ewvhB5fi7BrEllAxgfWdrp';

      const generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(orderId + "|" + paymentId)
        .digest("hex");

      if(generatedSignature === signature && paymentCompletedUsingWallet){
        const orderDetails = await Orderdb.findOne({_id:ogOrderId, email: req.session.userEmail});
        console.log('here datamm',orderDetails);
        let balanceAmount = orderDetails.balanceToPay;
        let paydAmount = orderDetails.finalAmount;
        let addBoth = balanceAmount + paydAmount
        let usedWalletAmount = addBoth - balanceAmount
        console.log(addBoth);
        console.log(balanceAmount);
        console.log(usedWalletAmount);
        let sample = (balanceAmount + paydAmount) - balanceAmount
        console.log('usedWalletAmount..................................uu',usedWalletAmount);


        const amountUpdate = await Orderdb.updateOne({ _id: ogOrderId, email: req.session.userEmail },
              {$inc : {finalAmount: balanceAmount}},{ new: true });
        if(amountUpdate.modifiedCount > 0) {
          console.log("both amount added together and ---------");
        }

        const balance = await Orderdb.updateOne({ _id: ogOrderId, email: req.session.userEmail}, {$set:{balanceToPay: 0}},{new:true})
        if(balance.modifiedCount>0){
          console.log("balancetopay  modified");
        }else{
          console.log("balancetopay  not modified");
        }
        const result = await Orderdb.updateOne({_id:ogOrderId, email: req.session.userEmail}, { $set:{ paymentstatus:'completed' }});
          // res.send({ success: true, message: 'Payment verified successfully.' });
          if(result.modifiedCount > 0) {
            res.send({ success: true, message: 'Payment verified and updated successfully.' });
          }else{
            res.send({ success: false, message: 'Payment  status could not be updated.' });
          }
      }else{
          res.send({ success: false, message: 'Payment verification failed.' });
      }
    } catch (err) {
      console.log(err);
    }
  },
};


// cancel-order - POST
const CancelUserOrder = {
  async CancelOrder(req, res) {
    try {
      const { orderId, productId, productQty } = req.body;
      console.log("Order id: thi is same for multiple products(parent)", req.body.orderId);
      console.log("single product id:", req.body.productId);
      console.log("single product user added Qty:", req.body.productQty);

      //find product to increase qty in productdb
      const result = await Orderdb.findOne({ _id: orderId, 'orderItems._id': productId }, { 'orderItems.$': 1 }).exec();
      if(result){
        const foundProduct = result.orderItems[0];
        console.log('Found product in orderDb:', foundProduct);
        console.log("Product ID:", foundProduct.productId);

        //increase quantity (in productDB) based on userAddedQuantity
        const updateResult = await productDB.updateOne({ _id: foundProduct.productId }, { $inc: { quantity: productQty } });
        if (updateResult) {
          console.log('Qty incremented successfully : ', updateResult);
        }

        //if order cancelled, then update orderStatus to cancelled and decrease qty in Orderdb
        const cancelOrderResult = await Orderdb.updateOne({ _id: orderId, 'orderItems._id': productId },
          { $set: { 'orderItems.$.orderStatus': 'cancelled' } }
        );
        console.log('Order status updated successfully:', cancelOrderResult);
        if (cancelOrderResult) {
          console.log('Order status and updated successfully.');
        } else {
          console.log('Product not found or status not updated.');
        }
      }else{
        console.log('Product not found.');
      }



      

      // testing
      console.log("Order id: thi is same for multiple products(parent)", req.body.orderId);
      console.log("single product id:", req.body.productId);
      const orderData = await Orderdb.findOne({_id: orderId});
      console.log('jhhhhhhhhh',orderData._id);

      // find cancelled single product in orderArray
      const cancelledProductDetails = await Orderdb.findOne({ _id: orderId, 'orderItems._id': productId }, { 'orderItems.$': 1 }).exec();
      if (!cancelledProductDetails) {
        console.log('Product not found in the order');
        return;
      }
      const cancelledDetails = cancelledProductDetails.orderItems[0];
      console.log("cancelled product details", cancelledDetails);
      
      console.log('product first price', cancelledDetails.firstPrice);
      console.log('product last price', cancelledDetails.lastPrice);
      console.log('product proDiscount', cancelledDetails.productofferDiscount);
      console.log('product catDiscount', cancelledDetails.categoryofferDiscount);

      const productDiscount = cancelledDetails.productofferDiscount;
      const categoryDiscount = cancelledDetails.categoryofferDiscount;
      const firstPrice = cancelledDetails.firstPrice;
      const discount = cancelledDetails.discount;
      const discountInNo = (firstPrice * discount)/100;
      const lastPrice = firstPrice - discountInNo
      

      let price = 0
      if(productDiscount && categoryDiscount){
        const finalizeDiscount = productDiscount > categoryDiscount ? productDiscount : categoryDiscount;
        console.log(finalizeDiscount);
        const discnt = finalizeDiscount + discount;
        console.log('lastPrice...', lastPrice);


        const discountInNums = (firstPrice * discnt)/100;
        console.log('discountInNums', discountInNums);
        price = firstPrice - discountInNums ;
        console.log('1', price);
      }else if(productDiscount){
        console.log(productDiscount);
        const discnt = productDiscount + discount
        const discountInNums = (firstPrice * discnt)/100;
        price = firstPrice - discountInNums ;
        console.log('2', price);
      }else if(categoryDiscount){
        console.log(categoryDiscount);
        const discnt = categoryDiscount + discount
        const discountInNums = (firstPrice * discnt)/100;
        price = firstPrice - discountInNums ;
        console.log('3', price);
      }else{
        console.log( 'lastPrice', lastPrice );
        price = lastPrice ;
        console.log('4', price);
      }

      const productFinalPrice = Math.floor(price * cancelledDetails.userAddedQty);
      console.log('price of a cancelled single product after apply all offers or without any offers',productFinalPrice);
      // console.log('price of a single product after apply all offers or without any offers',price * cancelledDetails.userAddedQty);
      const orderAmount = orderData.finalAmount;
      console.log('price of all products',orderAmount);
      const newFinalAmount = orderAmount - (price * cancelledDetails.userAddedQty)
      console.log('the price should show in orderdb after cancel the single product', newFinalAmount);

      if(orderData.paymentMethod === 'cod'){
        const updatePrice = await Orderdb.findOneAndUpdate({_id: orderId}, {$inc:{finalAmount : -productFinalPrice}}, {new : true});
      }
      if(orderData.paymentMethod === 'razorpay' && orderData.paymentstatus === 'completed'){
        const updatePrice = await Orderdb.findOneAndUpdate({_id: orderId}, {$inc:{finalAmount : -productFinalPrice}}, {new : true});
      }
      
      if(orderData.paymentstatus === 'completed'){
        const updatePrice = await Orderdb.findOneAndUpdate({_id: orderId}, {$set:{finalAmount : newFinalAmount}}, {new : true});

        //handle wallet
        const wallet = await walletDB.findOneAndUpdate({email: req.session.userEmail}, {$inc:{balance: price * cancelledDetails.userAddedQty},
                        $push: { transactions: {
                                  amount: price,
                                  action: "credit"
                                },},
                            },{ new: true, upsert: true });

          // if(!wallet){
          //   throw new Error('Wallet not found or nor created');
          // }

          // const newBalance = wallet.balance
      }

      //case of using both razorpay and wallet, but razorpay payment pending and single product order cancelled
      let ttlPricebeforeCancellation = orderData.finalAmount + orderData.balanceToPay;
      let ttlPriceAfterCancellation = ttlPricebeforeCancellation - productFinalPrice
      if(orderData.paymentstatus === 'pending' && orderData.paymentMethod === "wallet" && orderData.balanceToPay > 0){

        if(productFinalPrice === orderData.balanceToPay){
            console.log("case 1");
            const updateOrders = await Orderdb.findOneAndUpdate({_id: orderId}, {$set:{balanceToPay : 0, paymentstatus: "completed"}}, {new : true});
            if(updateOrders.modifiedCount === 0){
              console.log("while cancel order,payment status and balancetopay not updated(walletWithRazorpay)");
            }else{
              console.log("while cancel order, payment status and balancetopay updated(walletWithRazorpay)");
            }

        }else if(ttlPriceAfterCancellation > orderData.finalAmount){
          console.log("case 4");
          let remainingBalance = ttlPriceAfterCancellation - orderData.finalAmount;
          const updateOrders = await Orderdb.findOneAndUpdate({_id: orderId}, {$set:{balanceToPay : remainingBalance}}, {new : true});
          if(updateOrders.modifiedCount === 0){
            console.log("while cancel order,balancetopay not updated(walletWithRazorpay)");
          }else{
            console.log("while cancel order,balancetopay updated(walletWithRazorpay)");
          }
        }else if(orderData.balanceToPay > productFinalPrice){
              console.log("case 2");
              let newPrice = ttlPricebeforeCancellation - productFinalPrice
              const updateBalance = orderData.balanceToPay - productFinalPrice;
              const updateOrders = await Orderdb.findOneAndUpdate({_id: orderId}, {$set:{finalAmount: newPrice ,balanceToPay : updateBalance}}, {new : true});
              if(updateOrders.modifiedCount === 0){
                console.log("while cancel order,balancetopay not updated(walletWithRazorpay)");
              }else{
                console.log("while cancel order,balancetopay updated(walletWithRazorpay)");
              }
        }else if(orderData.finalAmount > ttlPriceAfterCancellation){
            console.log("case 3");
            let walletMoney = orderData.finalAmount - ttlPriceAfterCancellation;

            const wallet = await walletDB.findOneAndUpdate({email: req.session.userEmail}, {$inc:{balance: walletMoney},
              $push: { transactions: {
                        amount: walletMoney,
                        action: "credit"
                      },},
                  },{ new: true, upsert: true });
            if(wallet.modifiedCount === 0){
              console.log("while cancel order,wallet amount not credited(walletWithRazorpay)");
            }else{
              console.log("while cancel order, wallet amount credited (walletWithRazorpay)");
            }
            let newPrice = ttlPricebeforeCancellation - productFinalPrice;
            console.log("newprice in cancel-----------------", newPrice);
            const updateOrders = await Orderdb.findOneAndUpdate({_id: orderId}, {$set:{finalAmount: newPrice ,balanceToPay:0, paymentstatus:"completed"}}, {new: true});
            if(updateOrders.modifiedCount === 0){
              console.log("while cancel order,payment status and balancetopay not updated(walletWithRazorpay)");
            }else{
              console.log("while cancel order, payment status and balancetopay updated(walletWithRazorpay)");
            }

        }

      }

      res.redirect('/orders');
    }catch(error) {
      console.error('Error:', error);
      res.status(500).send('Internal Server Error');
    }
  },
};


// return-product - POST
const returnProduct = {
  async returnRequest(req, res) {
    try {
      const { orderId, productId, productQty } = req.body;
      console.log("Order id:", req.body.orderId);
      console.log("product id:", req.body.productId);
      console.log("product Qty:", req.body.productQty);

      //find product to increase qty in productdb
      const result = await Orderdb.findOne({ _id: orderId, 'orderItems._id': productId }, { 'orderItems.$': 1 }).exec();
      if (result) {
        const foundProduct = result.orderItems[0];
        console.log('Found product in orderDb:', foundProduct);
        console.log("Product ID:", foundProduct.productId);

        //increase quantity (in productDB) based on userAddedQuantity
        const updateResult = await productDB.updateOne({ _id: foundProduct.productId }, { $inc: { quantity: productQty } });
        if (updateResult) {
          console.log('Qty incremented successfully : ', updateResult);
        }

        //if order cancelled, then update orderStatus to cancelled and decrease qty in Orderdb
        const cancelOrderResult = await Orderdb.updateOne({ _id: orderId, 'orderItems._id': productId },
          { $set: { 'orderItems.$.orderStatus': 'return requested' } }
        );
        console.log('Order status updated successfully:', cancelOrderResult);
        if (cancelOrderResult) {
          console.log('Order status and updated successfully.');
        } else {
          console.log('Product not found or status not updated.');
        }
      } else {
        console.log('Product not found.');
      }




      // testing
      console.log("Order id: thi is same for multiple products(parent)", req.body.orderId);
      console.log("single product id:", req.body.productId);
      const orderData = await Orderdb.findOne({_id: orderId});
      console.log('jhhhhhhhhh',orderData._id);

      // find cancelled single product in orderArray
      const cancelledProductDetails = await Orderdb.findOne({ _id: orderId, 'orderItems._id': productId }, { 'orderItems.$': 1 }).exec();
      if (!cancelledProductDetails) {
        console.log('Product not found in the order');
        return;
      }
      const cancelledDetails = cancelledProductDetails.orderItems[0];
      console.log("cancelled product details", cancelledDetails);
      
      console.log('product first price', cancelledDetails.firstPrice);
      console.log('product last price', cancelledDetails.lastPrice);
      console.log('product proDiscount', cancelledDetails.productofferDiscount);
      console.log('product catDiscount', cancelledDetails.categoryofferDiscount);

      const productDiscount = cancelledDetails.productofferDiscount;
      const categoryDiscount = cancelledDetails.categoryofferDiscount;
      const firstPrice = cancelledDetails.firstPrice;
      const discount = cancelledDetails.discount;
      const discountInNo = (firstPrice * discount)/100;
      const lastPrice = firstPrice - discountInNo
      

      let price = 0
      if(productDiscount && categoryDiscount){
        const finalizeDiscount = productDiscount > categoryDiscount ? productDiscount : categoryDiscount;
        console.log(finalizeDiscount);
        const discnt = finalizeDiscount + discount;
        console.log('lastPrice...', lastPrice);


        const discountInNums = (firstPrice * discnt)/100;
        console.log('discountInNums', discountInNums);
        price = firstPrice - discountInNums ;
        console.log('1', price);
      }else if(productDiscount){
        console.log(productDiscount);
        const discnt = productDiscount + discount
        const discountInNums = (firstPrice * discnt)/100;
        price = firstPrice - discountInNums ;
        console.log('2', price);
      }else if(categoryDiscount){
        console.log(categoryDiscount);
        const discnt = categoryDiscount + discount
        const discountInNums = (firstPrice * discnt)/100;
        price = firstPrice - discountInNums ;
        console.log('3', price);
      }else{
        console.log( 'lastPrice', lastPrice );
        price = lastPrice ;
        console.log('4', price);
      }

      const productFinalPrice = Math.floor(price * cancelledDetails.userAddedQty);
      console.log('price of a returned single product after apply all offers or without any offers',productFinalPrice);
      // console.log('price of a single product after apply all offers or without any offers',price * cancelledDetails.userAddedQty);
      const orderAmount = orderData.finalAmount;
      console.log('price of all products',orderAmount);
      const newFinalAmount = orderAmount - (price * cancelledDetails.userAddedQty)
      console.log('the price should show in orderdb after return the single product', newFinalAmount);

      if(orderData.paymentMethod === 'cod'){
        const updatePrice = await Orderdb.findOneAndUpdate({_id: orderId}, {$inc:{finalAmount : -productFinalPrice}}, {new : true});
      }
      if(orderData.paymentMethod === 'razorpay' && orderData.paymentstatus === 'completed'){
        const updatePrice = await Orderdb.findOneAndUpdate({_id: orderId}, {$inc:{finalAmount : -productFinalPrice}}, {new : true});
      }
      
      if(orderData.paymentstatus === 'completed'){
        const updatePrice = await Orderdb.findOneAndUpdate({_id: orderId}, {$set:{finalAmount : newFinalAmount}}, {new : true});

        //handle wallet
        const wallet = await walletDB.findOneAndUpdate({email: req.session.userEmail}, {$inc:{balance: price * cancelledDetails.userAddedQty},
                        $push: { transactions: {
                                  amount: price,
                                  action: "credit"
                                },},
                            },{ new: true, upsert: true });

          // if(!wallet){
          //   throw new Error('Wallet not found or nor created');
          // }

          // const newBalance = wallet.balance
      }

      //case of using both razorpay and wallet, but razorpay payment pending and single product order cancelled
      let ttlPricebeforeCancellation = orderData.finalAmount + orderData.balanceToPay;
      let ttlPriceAfterCancellation = ttlPricebeforeCancellation - productFinalPrice
      if(orderData.paymentstatus === 'pending' && orderData.paymentMethod === "wallet" && orderData.balanceToPay > 0){

        if(productFinalPrice === orderData.balanceToPay){
            console.log("case 1");
            const updateOrders = await Orderdb.findOneAndUpdate({_id: orderId}, {$set:{balanceToPay : 0, paymentstatus: "completed"}}, {new : true});
            if(updateOrders.modifiedCount === 0){
              console.log("while return order,payment status and balancetopay not updated(walletWithRazorpay)");
            }else{
              console.log("while return order, payment status and balancetopay updated(walletWithRazorpay)");
            }

        }else if(ttlPriceAfterCancellation > orderData.finalAmount){
          console.log("case 4");
          let remainingBalance = ttlPriceAfterCancellation - orderData.finalAmount;
          const updateOrders = await Orderdb.findOneAndUpdate({_id: orderId}, {$set:{balanceToPay : remainingBalance}}, {new : true});
          if(updateOrders.modifiedCount === 0){
            console.log("while return order,balancetopay not updated(walletWithRazorpay)");
          }else{
            console.log("while return order,balancetopay updated(walletWithRazorpay)");
          }
        }else if(orderData.balanceToPay > productFinalPrice){
              console.log("case 2");
              let newPrice = ttlPricebeforeCancellation - productFinalPrice
              const updateBalance = orderData.balanceToPay - productFinalPrice;
              const updateOrders = await Orderdb.findOneAndUpdate({_id: orderId}, {$set:{finalAmount: newPrice ,balanceToPay : updateBalance}}, {new : true});
              if(updateOrders.modifiedCount === 0){
                console.log("while return order,balancetopay not updated(walletWithRazorpay)");
              }else{
                console.log("while return order,balancetopay updated(walletWithRazorpay)");
              }
        }else if(orderData.finalAmount > ttlPriceAfterCancellation){
            console.log("case 3");
            let walletMoney = orderData.finalAmount - ttlPriceAfterCancellation;

            const wallet = await walletDB.findOneAndUpdate({email: req.session.userEmail}, {$inc:{balance: walletMoney},
              $push: { transactions: {
                        amount: walletMoney,
                        action: "credit"
                      },},
                  },{ new: true, upsert: true });
            if(wallet.modifiedCount === 0){
              console.log("while return order,wallet amount not credited(walletWithRazorpay)");
            }else{
              console.log("while return order, wallet amount credited (walletWithRazorpay)");
            }
            let newPrice = ttlPricebeforeCancellation - productFinalPrice;
            console.log("newprice in cancel-----------------", newPrice);
            const updateOrders = await Orderdb.findOneAndUpdate({_id: orderId}, {$set:{finalAmount: newPrice ,balanceToPay:0, paymentstatus:"completed"}}, {new: true});
            if(updateOrders.modifiedCount === 0){
              console.log("while return order,payment status and balancetopay not updated(walletWithRazorpay)");
            }else{
              console.log("while return order, payment status and balancetopay updated(walletWithRazorpay)");
            }

        }

      }







      res.redirect('/orders');
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Internal Server Error');
    }
  },
};

// payment retry - POST
const retryOnlinePayment = {
  async razorpayOption(req, res) {
    try {
      const { ordrId, prdctId, prdctQty } = req.body;
      console.log('data...',ordrId, prdctId, prdctQty);
      console.log("hereeeee");
      const orderData = await Orderdb.findOne({_id : ordrId})
      console.log("herhjgjh");
      const finalAmount = orderData.finalAmount ;
      console.log("herehjgujveeee", orderData.finalAmount);
      console.log("final Amount got in retry option;;;;;;;;;;;;;;;;;;;;;", finalAmount );

      // console.log('when razorpay........this will give the proper price: ', req.body.amount);


      if (finalAmount < 1) {
        return res.status(400).json({
          error: {
            code: 'BAD_REQUEST_ERROR',
            description: 'The amount must be at least INR 1.00........',
            field: 'amount'
          }
        });
      }


      var instance = new Razorpay({
        key_id: 'rzp_test_FFleULTlFE3GDB',
        key_secret: 'K0ewvhB5fi7BrEllAxgfWdrp',
      });

      // Razorpay utils
      function generateSignature(data, secret) {
        return crypto.createHmac('sha256', secret).update(data).digest('hex');
      }

      // Create an order with Razorpay using finalAmount
      console.log(finalAmount);
      var options = {
        amount: Math.round(finalAmount) * 100, // Amount in the smallest currency unit
        currency: "INR",
        receipt: "rcp1", // Custom receipt ID
        payment_capture: 1 // Auto capture the payment
      };


      const order = await instance.orders.create(options);

      
      res.status(200).json({
        success:true,
        paymentMethod : "razorpay",
        order,
        ordrId,
        prdctId
      });
    



    } catch (error) {
      console.error('Error adding product to cart:', error);
      res.status(500).send('Internal Server Error');
    }
  },
};




// order retry-verifyPayment - POST
const orderVerifyPayment = {
  async retryPayment(req, res) {
    try {
      const { orderId, paymentId, signature, parentId, productId } = req.body;

      console.log("this is retry verify section, is orderId and single is here------------..",parentId, productId );
      console.log("hghg", orderId, paymentId, signature, parentId, productId);


      console.log("asdfghj..", orderId, paymentId, signature);
      const secret = 'K0ewvhB5fi7BrEllAxgfWdrp';

      const generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(orderId + "|" + paymentId)
        .digest("hex");
        console.log("111111111");
      if(generatedSignature === signature) {
        console.log("2222222222222");
          const result = await Orderdb.updateOne({_id:parentId, email: req.session.userEmail}, { $set:{ paymentstatus:'completed' }});
          // res.send({ success: true, message: 'Payment verified successfully.' });
          if(result.modifiedCount > 0) {
            console.log('Payment verified and updated successfully.');
            res.send({ success: true, message: 'Payment verified and updated successfully.' });
          }else{
            console.log('Payment  status could not be updated.');
            res.send({ success: false, message: 'Payment  status could not be updated.' });
          }
      }else{
        console.log('Payment verification failed.');
          res.send({ success: false, message: 'Payment verification failed.' });
      }
    } catch (err) {
      console.log(err);
    }
  },
};




// razorpayWithWallet - paymentRetry - POST
const retryRazorpayWithWallet = {
  async razorpayOption(req, res) {
    try {
      console.log('payment with wallet and razorpy');
      const { orderId, productId, productQty } = req.body;
      console.log('data...',orderId, productId, productQty);
      const orderData = await Orderdb.findOne({_id : orderId})
      
      // const finalAmount = orderData.finalAmount ;
      const balanceToPay = orderData.balanceToPay;

      var instance = new Razorpay({
        key_id: 'rzp_test_FFleULTlFE3GDB',
        key_secret: 'K0ewvhB5fi7BrEllAxgfWdrp',
      });

      //razorpay utils
      function generateSignature(data, secret) {
        return crypto.createHmac('sha256', secret).update(data).digest('hex');
      }

      

      // create an order with Razorpay
      console.log(balanceToPay);
      var options = {
        amount: Math.round(balanceToPay) * 100, //amount in the smallest currency unit 
        currency: "INR",
        receipt: "rcp1", //custom receipt ID
        payment_capture: 1 //auto capture the payment
      };

      const order = await instance.orders.create(options);

      
      res.status(200).json({
        success:true,
        paymentMethod : "wallet",
        razorpayWithWallet : true,
        order
      });
    



    } catch (error) {
      console.error('Error adding product to cart:', error);
      res.status(500).send('Internal Server Error');
    }
  },
};



// order retry-verifyPayment - POST
const orderVerifyPaymentOfWallet = {
  async retryPayment(req, res) {
    try {
const {userEmail} = req.session;

      console.log('now in the verify section of retry razorpayWithWallet');
      const { orderId, paymentId, signature, parentId, productId } = req.body;

      console.log("this is retry verify section ",parentId, productId );


      console.log("asdfghj..", orderId, paymentId, signature);
      const secret = 'K0ewvhB5fi7BrEllAxgfWdrp';

      const generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(orderId + "|" + paymentId)
        .digest("hex");

      if(generatedSignature === signature) {
        console.log("inside of if condition,,,,,,,,,", parentId);

          const orderData = await Orderdb.findOne({_id:parentId, email: req.session.userEmail});
          const newFinalAmount = parseInt(orderData.finalAmount + orderData.balanceToPay);
          console.log("newFinalAmount", newFinalAmount);

          const result = await Orderdb.updateOne({_id:parentId, email: req.session.userEmail},
                         { $set:{ paymentstatus:'completed', finalAmount : newFinalAmount }, $unset:{ balanceToPay:""} },{ new : true } );

          // res.send({ success: true, message: 'Payment verified successfully.' });
          if(result.modifiedCount > 0) {
            
            const totalAmount = orderData.finalAmount + orderData.balanceToPay;
            const usedWalletAmount = totalAmount - orderData.finalAmount
            const reduceWalletAmount = await walletDB.findOneAndUpdate({email: userEmail}, {$inc:{balance: -usedWalletAmount}}, {new: true});
            if(reduceWalletAmount.modifiedCount > 0){
              console.log("wallet amount reduced");
            }else{
              console.log('wallet amount not reduced');
            }
         
            console.log('Payment verified and updated successfully.');
            res.send({ success: true, message: 'Payment verified and updated successfully.' });
          }else{

            const totalAmount = orderData.finalAmount + orderData.balanceToPay;
            const usedWalletAmount = totalAmount - orderData.finalAmount
            const reduceWalletAmount = await walletDB.findOneAndUpdate({email: userEmail}, {$inc:{balance: -usedWalletAmount}}, {new: true});
            if(reduceWalletAmount.modifiedCount > 0){
              console.log("wallet amount reduced");
            }else{
              console.log('wallet amount not reduced');
            }


            console.log('Payment  status could not be updated.');
            res.send({ success: false, message: 'Payment  status could not be updated.' });
          }
      }else{
        console.log('Payment verification failed.');
          res.send({ success: false, message: 'Payment verification failed.' });
      }
    } catch (err) {
      console.log(err);
    }
  },
};



// cart-qty - POST
const cartQuantity = {
  async productQuantity(req, res) {
    try {
      console.log('cart quantity');
      res.redirect('/shopping-cart');
    } catch (error) {
      console.error('Error adding product to cart:', error);
      res.status(500).send('Internal Server Error');
    }
  },
};


//wishlist - POST
const wishList = {
  async userwishlist(req, res) {
    try {
      const { id } = req.body;
      const { userEmail } = req.session;

      const ogProductData = await productDB.findOne({ _id: id })
      console.log("product og qty from productDB", ogProductData.quantity);

      const newWishlistDetails = new wishlistDB({ email: userEmail, productId: id });
      //save new wishlist details in mongodb
      await newWishlistDetails.save();
      console.log("wishlist product saved in db");

      res.redirect(`/single-product/${id}`);
    } catch (error) {
      console.error('Error adding product to wishlist:', error);
      res.status(500).send('Internal Server Error');
    }
  },
};


//wishlistRemove-item - POST
const wishListRemoveItem = {
  async removeItem(req, res) {
    try {
      const { email, id } = req.body;
      console.log("id and email", id, email);
      const result = await wishlistDB.deleteOne({ productId: id, email: email })

      if (result) {
        console.log("product removed from wishlist");
        console.log(result);
      } else {
        console.log('product still in the wishlist,not removed :( ');
      }
      res.redirect('/wishlist');
    } catch (error) {
      console.error('Error removing product from wishlist:', error);
      res.status(500).send('Internal Server Error');
    }
  },
};


//wishlist- add to cart - POST
const wishListMoveToCart = {
  async moveToCart(req, res) {
    try {
      console.log("id", req.body.id);
      const id = req.body.id

      const result = await shoppingCartDB.findOne({ productId: id })
      if (result) {
        //increment current qty + 1
        await shoppingCartDB.updateOne({ productId: id }, { $inc: { userAddedQuantity: 1 } });
        await wishlistDB.deleteOne({ productId: id })
      } else {
        // add product to cart
        const { userEmail } = req.session;
        const newCartDetails = new shoppingCartDB({ email: userEmail, productId: id });
        //save new cartDetails in mongodb
        await newCartDetails.save();
        await wishlistDB.deleteOne({ productId: id })
      }

      res.redirect('/wishlist');
    } catch (error) {
      console.error('Error removing product from wishlist:', error);
      res.status(500).send('Internal Server Error');
    }
  },
};



module.exports = { searchProduct, shoppingCart, cartQty, removeItem, productPayment, deliveryAddress, checkoutNewAddress,
      checkoutUpdateAddress,deleteCheckoutAddress, paymentType, finalpData, createOrderId, verifyPayment, CancelUserOrder,
      returnProduct,cartQuantity, wishList, wishListRemoveItem, wishListMoveToCart, CouponApply, retryOnlinePayment,
      orderVerifyPayment, verifyPaymentOfWallet, retryRazorpayWithWallet, orderVerifyPaymentOfWallet }