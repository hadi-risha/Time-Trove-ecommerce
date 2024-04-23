const express = require("express");
const router = express.Router();
const store = require("../middlewares/multer") //multer middleware

//all GET functions
const { getUserSignup, getOtpPage, getUserLogin, getHome, getForgotPsw, getPswSetup, getAllWatches,
        getSingleProduct, getMenswatches, getWomenswatches, getShoppingCart, getPaymentDeliveryDetails,
        checkoutAddAddress,checkoutEditAddress,getPaymentMethod, getOrderSuccess, getPaymentFailed,
        getOrders, getOrdersummary, getWishlist, getUserProfile,getUserEditProfile, getAddAddress,
        getUserAddress, getAddressImage, getEditAddress , getretryPaymentSuccess, getUserWallet,
        getWalletPaymentSuccess, getWalletPaymentFailed, getDownloadInvoice, getResetPsw } = require('../services/user_render');

const { userSignup, setupLogin, otpVerification, userLogout, resendOtp, forgotPsw,
        authUserforgotPsw, setPsw } = require('../controller/logSignup_controller');

const { searchProduct, shoppingCart, cartQty, removeItem, productPayment, deliveryAddress, checkoutNewAddress,checkoutUpdateAddress,
        deleteCheckoutAddress, paymentType, createOrderId, verifyPayment, finalpData, CancelUserOrder, returnProduct,
        cartQuantity, wishList, wishListRemoveItem, wishListMoveToCart, CouponApply,
        retryOnlinePayment, orderVerifyPayment, verifyPaymentOfWallet, retryRazorpayWithWallet,
        orderVerifyPaymentOfWallet } = require('../controller/product_controller');

const { profileEdit, saveDetails, NewAddress, editAddress, deleteAddress } = require('../controller/profile_controller');

const {walletAddMoney, verifyWalletPayment} = require('../controller/walletController');

//middlewares
const { useralreadyloggined, notAuth, sendpswLink, isAuth } = require('../middlewares/userSideMiddlewares');


/************* userSide Routes ****************/

// login/signup section
router.get('/signup', useralreadyloggined, getUserSignup.getSignupPage);

router.post('/signup', userSignup.signup);

router.get('/otp-verification', useralreadyloggined, getOtpPage.otpPage);

router.post('/otp-verification', otpVerification.otpSetup);

router.post('/otp-reset', resendOtp.otpSetup);

router.get('/user-login', useralreadyloggined, getUserLogin.getLoginPage);

router.post('/user-login', setupLogin.loginUser);

router.get('/', getHome.renderHome);

router.post("/user-logout", userLogout.usersignout);


// reset password section
router.get('/forgot-password', getForgotPsw.forgotPsw);

router.post('/forgot-password', forgotPsw.pswSetup);

router.get('/reset-password', getResetPsw.resetPsw);

router.post('/authUser-forgotPassword', authUserforgotPsw.pswSetup);

router.get('/set-psw', sendpswLink, getPswSetup.setNewPsw);

router.post('/set-psw', setPsw.setNewPsw);            


// product section
router.get('/all-watches', getAllWatches.allWatches);

router.get('/single-product/:id', getSingleProduct.singleProd);

router.get('/mens-watches', getMenswatches.menswatch);

router.get('/womens-watches', getWomenswatches.womenswatch);

router.get('/search', searchProduct.findProduct);            


// shopping cart section
router.get('/shopping-cart', notAuth, getShoppingCart.shoppingCart);

router.post('/shopping-cart', isAuth, shoppingCart.userCart);

router.patch('/update-cart-quantity', isAuth, cartQty.addItem);

// router.post('/cart-qty', isAuth, cartQuantity.productQuantity);  //check

router.delete('/remove-item', isAuth, removeItem.moveFromCart);

router.post('/product-payment', isAuth, productPayment.proceedtoPayment);   //not used properly


// checkout Address section
router.get('/checkout-address', notAuth, getPaymentDeliveryDetails.paymentDeliveryDetails);

router.post('/delivery-address', isAuth, deliveryAddress.selectedAddress); 

router.get('/checkout-addAddress', notAuth, checkoutAddAddress.addAddress);

router.post('/checkout-addAddress', isAuth, checkoutNewAddress.newAddress); 

router.get('/checkout-editAddress/:id', notAuth, checkoutEditAddress.updateAddress);

router.patch('/checkout-editAddress', isAuth, checkoutUpdateAddress.updateAddress); 

router.delete('/delete-checkoutAddress', isAuth, deleteCheckoutAddress.removeAddress); 

router.post('/coupon-apply', isAuth, CouponApply.applyAndRemoveCoupon); 


// checkout Payment section
router.get('/checkout-paymentMode', notAuth, getPaymentMethod.paymentType);

router.post('/payment-type', isAuth, paymentType.paymentMode);

router.post('/final-products', isAuth, finalpData.orderedProducts);

router.get('/order-placed', notAuth, getOrderSuccess.orderPlaced);

router.post('/paymentVerify', isAuth, verifyPayment.razorpayPayment);

router.post('/verifyPaymentOfWallet', isAuth, verifyPaymentOfWallet.razorpayPayment);

router.get('/payment-failed', notAuth, getPaymentFailed.paymentNotCompleted);


// order section
router.get('/orders', notAuth, getOrders.userOrders);

router.get('/order-summary', notAuth, getOrdersummary.userOrdersummary);

router.post('/cancel-order', isAuth, CancelUserOrder.CancelOrder);

router.post('/return-product', isAuth, returnProduct.returnRequest);
// (retry - razorpay)
router.post('/retry-onlinePayment', isAuth, retryOnlinePayment.razorpayOption);

router.post('/retryPaymentVerify', isAuth, orderVerifyPayment.retryPayment);
// (retry - razorpay with wallet)
router.post('/retry-walletWithRazorpay', isAuth, retryRazorpayWithWallet.razorpayOption);

router.post('/retryPaymentVerifyOfWallet', isAuth, orderVerifyPaymentOfWallet.retryPayment);

router.get('/retry-paymentSuccess', notAuth, getretryPaymentSuccess.orderPayment);

router.get('/download-invoice', notAuth, getDownloadInvoice.downloadInvoice);


// wishlist section
router.post('/wishlist', isAuth, wishList.userwishlist);

router.get('/wishlist', notAuth, getWishlist.wishlist);

router.delete('/wishlistRemove-item', isAuth, wishListRemoveItem.removeItem);

router.post('/wishlist-moveToCart', isAuth, wishListMoveToCart.moveToCart);


// user profile section
router.get('/user-profile', notAuth, getUserProfile.userProfile);

router.post('/profile-edit', isAuth, profileEdit.userProfile);

router.get('/edit-profile', notAuth, getUserEditProfile.EditProfile);

router.patch('/save-profileDetails', isAuth, saveDetails.userDetails);


// user address section
router.get('/add-address', notAuth, getAddAddress.userAddress);

router.post('/save-address', isAuth, NewAddress.saveAddress);

router.get('/user-address', notAuth, getUserAddress.userAddress);

router.get('/edit-address/:id', notAuth, getEditAddress.updateAddress);

router.patch('/edit-address', isAuth, editAddress.userAddress);

router.delete('/delete-address', isAuth, deleteAddress.removeAddress);

router.get('/address-image', notAuth, getAddressImage.addressImage);


//user wallet
router.get('/user-wallet', notAuth, getUserWallet.userWallet);

router.post('/wallet-addMoney', isAuth, walletAddMoney.addMoney );

router.post('/wallet-verifyPayment', isAuth, verifyWalletPayment.razorpayPayment);

router.get('/wallet-PaymetSuccess', notAuth,getWalletPaymentSuccess.paymentSuccess);

router.get('/wallet-paymentFailed', notAuth, getWalletPaymentFailed.paymentNotCompleted);

/************* end of userSide Routes ****************/





module.exports = router;



