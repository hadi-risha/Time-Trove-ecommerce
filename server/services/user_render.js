const categoryDB = require("../model/categoryModel");
const userdbCollection = require("../model/model");
const productDB = require("../model/productModel");
const AddressDB = require("../model/address-model");
var { sendOtpMail } = require('../nodemailerStuff/email');
const shoppingCartDB = require("../model/shoppingCartModel");
const Orderdb = require("../model/orderModel")
const wishlistDB = require('../model/wishlistModel')
const couponDB = require('../model/couponModel')
const categoryOfferDB = require('../model/offer-CategoryModel');
const walletDB = require("../model/walletModel")
const path = require('path');
const fs = require('fs')
const puppeteer = require('puppeteer-core');
const ejs = require('ejs')


/************* User side ****************/

//signup - GET
const getUserSignup = {
    async getSignupPage(req, res) {
        req.session.invaliddReferralLink = false;
        console.log("Invalid referral link session value: outside", req.session.invaliddReferralLink);

        //track the referredUser
        const referralId = req.query.userId;      //id of the referred user
        console.log('referred user id', referralId );

        const referredUser = await userdbCollection.findOne({_id: referralId});
        if(referredUser){
        console.log("referred user exist");
        req.session.invaliddReferralLink = false;
        console.log("Invalid referral link session value: when user exist", req.session.invaliddReferralLink);
        }else{
        console.log("Invalid referral link session value: inside and invalid case", req.session.invaliddReferralLink);
        console.log("invalid referral link");
        req.session.invaliddReferralLink = true;
        }
          
        const { passnotmatch, namenotvalid, userExist, invaliddReferralLink } = req.session;
        res.render("signup", { invaliddReferralLink, referralId, passError: passnotmatch, nameError: namenotvalid,
             userExistError: userExist }, (error, data) => {
            if (error) {
                return res.status(500).send("Internal server error");
            }

            delete req.session.passnotmatch;
            delete req.session.namenotvalid;
            delete req.session.userExist;
            req.session.invaliddReferralLink = null;
            res.send(data);
        });
    },
};


//otp-verification - GET
const getOtpPage = {
    async otpPage(req, res) {
        const { checkVerify } = req.query;
        const { ProvidedOTP, userEmail, otpNotExist } = req.session;

        if (checkVerify) {
            await sendOtpMail(req, res);
            return;
        }
        res.render("otp_verification", { otpNotExist: otpNotExist, otpError: ProvidedOTP, userEmail: userEmail }, (error, data) => {
            if (error) {
                return res.status(500).send("Internal server error shown");
            }
            delete req.session.otpNotExist;     // used for timer
            delete req.session.ProvidedOTP;    
            res.send(data);
        });
    },
};


//user login - GET
const getUserLogin = {
    getLoginPage(req, res) {
        let { successPswReset, resetpswSuccessMsgDisplayed } = req.session;
        let resetMessageDisplayed = resetpswSuccessMsgDisplayed;
        if (successPswReset && !resetMessageDisplayed) {
            resetpswSuccessMsgDisplayed = true;      
        } else {
            resetpswSuccessMsgDisplayed = false
            resetMessageDisplayed = false
        }

        let { youAreBlocked, blockSuccessMsgDisplayed } = req.session;
        
        //user blocked popup message
        let blockMessageDisplayed = blockSuccessMsgDisplayed;
        if (youAreBlocked && !blockMessageDisplayed) {
            blockSuccessMsgDisplayed = true;      
        } else {
            blockSuccessMsgDisplayed = false
            blockMessageDisplayed = false
        }

        const { notVerified, passincorrect, emailincorrect, invalidCredentials } = req.session;
        res.render("user_login", {
            blockMessageDisplayed, blockedSuccess: youAreBlocked, PswResetSuccess: successPswReset,
            resetMessageDisplayed, verifiedError: notVerified, logpassError: passincorrect,
            logemailError: emailincorrect, credentialError: invalidCredentials
        }, (error, data) => {
            if (error) {
                return res.status(500).send("Internal server error");
            }
            resetpswSuccessMsgDisplayed = false;
            delete req.session.successPswReset;

            blockSuccessMsgDisplayed = false;
            delete req.session.youAreBlocked;

            delete req.session.notVerified;
            delete req.session.passincorrect;
            delete req.session.emailincorrect;
            delete req.session.invalidCredentials;

            res.send(data);
        });
    },
};


//home - GET
const getHome = {
    async renderHome(req, res) {
        try {
            let { successMessageDisplayed, isUserAuth } = req.session
            // login success popup
            let messageDisplayed = successMessageDisplayed;
            if(isUserAuth && !messageDisplayed) {
                successMessageDisplayed = true;    //create session for displaying sccs msg
                console.log('login message');
            }else{
                successMessageDisplayed = false;
                messageDisplayed = false;
            }

            const { userEmail } = req.session;
            const result = await userdbCollection.findOne({ email: userEmail });
            if(result){
                console.log('data', result.name, result.email);
            }else{
                console.log('User not found');
            }

            // coupon
            const couponData = await couponDB.find();

            //random coupon data
            const randomIndex = Math.floor(Math.random() * couponData.length);
            const randomCouponData = couponData[randomIndex];

            //cart count in heart icon
            const cartCount = await shoppingCartDB.countDocuments({email: userEmail})
            console.log(cartCount);

            const { successPasswordReset, isUserAuthenticated, logoutSuccess } = req.session;
            res.render('home', {cartCount,
                randomCouponData,PswResetSuccess: successPasswordReset, userName: result ? result.name : 'User not found',
                userLoggined: isUserAuthenticated, loginSuccess: isUserAuth, messageDisplayed,logoutSuccess: logoutSuccess
            }, (err, html) => {
                if(err) {
                    return res.send('Render error');
                }
                successMessageDisplayed = false;
                delete req.session.isUserAuth;

                delete req.session.logoutSuccess;
                delete req.session.successPasswordReset;

                res.send(html);
            });
        }catch (error) {
            console.error('Error retrieving user:', error);
            res.render('error', { message: 'Error retrieving user' });
        }
    },
};


//forgot-psw - GET
const getForgotPsw = {
    forgotPsw(req, res) {
        let { successMessageDisplayed, backLink } = req.session;
        //email sent success message
        let messageDisplayed = successMessageDisplayed;
        if (backLink && !messageDisplayed) {
            successMessageDisplayed = true;       
        }else {
            successMessageDisplayed = false;
            messageDisplayed = false;
        }

        const { emailMatchError, forgotUserNotExist } = req.session;
        res.render("reset_password", {
             emailMatchError: emailMatchError, emailSuccess: backLink,
             messageDisplayed, usernotExist: forgotUserNotExist 
        },(error, data) => {
            if (error) {
                return res.status(500).send("Internal server error");
            }
            successMessageDisplayed = false;
            delete req.session.forgotUserNotExist;
            delete req.session.backLink;
            delete req.session.emailMatchError;

            res.send(data);
        });
    },
}


//reset-psw - GET
const getResetPsw = {
    resetPsw(req, res) {
        let { successMessageDisplayed, backLink } = req.session;
        //email sent success message
        let messageDisplayed = successMessageDisplayed;
        if (backLink && !messageDisplayed) {
            successMessageDisplayed = true;       
        }else {
            successMessageDisplayed = false;
            messageDisplayed = false;
        }

        const { emailMatchError, forgotUserNotExist } = req.session;
        res.render("reset_password", {
             emailMatchError: emailMatchError, emailSuccess: backLink,
             messageDisplayed, usernotExist: forgotUserNotExist 
        },(error, data) => {
            if (error) {
                return res.status(500).send("Internal server error");
            }
            successMessageDisplayed = false;
            delete req.session.forgotUserNotExist;
            delete req.session.backLink;
            delete req.session.emailMatchError;

            res.send(data);
        });
    },
}


//forgot psw - GET
const getPswSetup = {
    setNewPsw(req, res) {
        const { invalidPassword, userEmail, fpasswordNotMatch } = req.session;
        res.render("set_psw", { invalidPassword: invalidPassword, userEmail: userEmail,
                passwordNotMatch: fpasswordNotMatch }, (error, data) => {
            if (error) {
                return res.status(500).send("Internal server error");
            }
            delete req.session.invalidPassword;
            delete req.session.fpasswordNotMatch;

            res.send(data);
        });
    },
}


//allWatches - GET
const getAllWatches = {
    async allWatches(req, res) {
        try {
            const allProductDetails = await productDB.find();
            res.render("all_watches", { allProductDetails });
        } catch (error) {
            console.error('Error fetching products from MongoDB:', error);
            res.status(500).send('Internal Server Error');
        };
    },
};


///single-product-GET
const getSingleProduct = {
    async singleProd(req, res) {
        try {
            const id = req.params.id;
            const allProductDetails = await productDB.findOne({ _id: id });
            console.log('single product data:', allProductDetails);

            const { userEmail } = req.session;
            const result = await userdbCollection.findOne({ email: userEmail });
            const isInBag = await shoppingCartDB.findOne({ $and: [{ email: userEmail, productId: id }] });
            const isInWishlist = await wishlistDB.findOne({ $and: [{ email: userEmail, productId: id }] });
            if (isInWishlist) {
                console.log("product already in wishlist.");
            }

            if (result) {
                console.log('User data:', result.name, result.email);
            } else {
                console.log('User not found');
            }

            const { isUserAuthenticated } = req.session;
            //cart count in cart icon
            const cartCount = await shoppingCartDB.countDocuments({email: userEmail})

            // *********cat/product offer section*********             
            const categoryOfferExist = await categoryOfferDB.findOne({category: allProductDetails.category, unlisted:false, expDate: {$gt: new Date()}});
            console.log('hgcat off',categoryOfferExist);

            let categoryDiscInPercentage = 0
            if(categoryOfferExist) {
                console.log("category offer exist in this single watch page");
                console.log("offer in Category:", categoryOfferExist.category);
                console.log("Discount:", categoryOfferExist.discount);
                categoryDiscInPercentage = categoryOfferExist.discount
            }else{
                console.log("category offer not exist for this single product");
            }
            // ***********/cat/product offer section************

            res.render("single_product", {categoryDiscInPercentage, categoryOfferExist, cartCount,
                    userName: result ? result.name : 'User not found', userLoggined: isUserAuthenticated,
                    allProductDetails, isInBag, isInWishlist
            }, (err, html) => {
                if (err) {
                    console.log('Render error: ' + err.message);
                    return res.status(500).send('Render error: ' + err.message);
                }
                res.send(html);
            });
        }catch(error) {
            console.error('Error fetching product details:', error);
            res.status(500).send('Internal Server Error');
        }
    },
};


//mens watches - GET
const getMenswatches = {
    async menswatch(req, res) {
        try {
            const { userEmail } = req.session;
            const result = await userdbCollection.findOne({ email: userEmail });
            if (result) {
                console.log('user data:', result.name, result.email);
            } else {
                console.log('User not found');
            }

            const allCategoryDetails = await categoryDB.find();
            const { isUserAuthenticated } = req.session;

            // pagination
            const pageNum = parseInt(req.query.page) || 1;
            const totalProducts = await productDB.countDocuments({category:"men", unlisted:false})

            const perPage = 12; 
            const totalPages = Math.ceil(totalProducts / perPage);

            //adjust products per page if total < 12
            if (totalProducts < perPage && pageNum === totalPages) {
                perPage = totalProducts;
            }

            //fetch products for the current page
            const allProductDetails = await productDB.find({category:"men", unlisted:false}).skip((pageNum - 1) * perPage).limit(perPage);
            if(allProductDetails.length < 0){
                req.session.productNotFound = true
            }

            //generate pagination links
            const paginationLinks = [];
            for (let i = 1; i <= totalPages; i++) {
                //generate links only for pages with products
                if (i <= totalPages) {
                    paginationLinks.push({
                        page: i,
                        url: `/mens-watches?page=${i}`,
                        isActive: i === pageNum
                    });
                }
            }
            console.log('paginationLinks',paginationLinks);
            console.log('totalProducts,totalPages',{ totalProducts, totalPages }); 


            //sort section
            const { sortBy = 'productName', order = 'asc' } = req.query;
            if (!['productName', 'lastPrice'].includes(sortBy)) { 
                return res.status(400).send('Invalid sortBy parameter');
            }
            if (!['asc', 'desc'].includes(order)) {
                return res.status(400).send('Invalid order parameter');
            }

            console.log('sortBy',sortBy, 'order',order);

            const products = await productDB.find({ unlisted: false })
            .sort({ [sortBy]: order })
            .exec();
            // /sort section

            //cart count in cart icon
            const cartCount = await shoppingCartDB.countDocuments({email: userEmail})
            console.log(cartCount);


            // *********cate/product offer section*********    
            const categoryOfferExist = await categoryOfferDB.findOne({category: 'men',unlisted:false, expDate: {$gt: new Date()}});
            console.log('hgcat off',categoryOfferExist);

            
            let categoryDiscInPercentage = 0
            if(categoryOfferExist) {
                console.log("category offer exist in mens watches page");
                console.log("offer in Category:", categoryOfferExist.category);
                console.log("Discount:", categoryOfferExist.discount);
                categoryDiscInPercentage = categoryOfferExist.discount
            }else{
                console.log("category offer not exist");
            }
            // ***********/cate/product offer section************

            allProductDetails.forEach(product => {
                console.log('show mens all watches',allProductDetails);
            })

            res.render("mens_watches", {  categoryOfferExist, categoryDiscInPercentage,
                products, cartCount, 
                pageTitle: 'Mens Watches',
                page: '/mens-watches',
                paginationLinks,
                currentPage: pageNum,
                totalPages,
                productNotFound: req.session.productNotFound,
                userName: result ? result.name : 'User not found',
                userLoggined: isUserAuthenticated,
                allCategoryDetails,
                allProductDetails
            });
        }catch(error) {
            console.error('Error fetching products from MongoDB:', error);
            res.status(500).send('Internal Server Error');
        }
    },
};


//womens watches - GET
const getWomenswatches = {
    async womenswatch(req, res) {
        try {
            const { userEmail } = req.session;
            const result = await userdbCollection.findOne({ email: userEmail });
            if (result) {
                console.log('User data: ', result.name, result.email);
            }else{
                console.log('User not found');
            }
            const allCategoryDetails = await categoryDB.find();

            const { isUserAuthenticated } = req.session;

            // ****Pagination****
            const pageNum = parseInt(req.query.page) || 1;
            const totalProducts = await productDB.countDocuments({category:"women", unlisted:false});
            
            let perPage = 12; 
            const totalPages = Math.ceil(totalProducts / perPage);

            //adjust products per page if total < 12
            if (totalProducts < perPage && pageNum === totalPages) {
                perPage = totalProducts;
            }

            //fetch products for the current page
            const allProductDetails = await productDB.find({category:"women", unlisted:false}).skip((pageNum - 1) * perPage).limit(perPage).sort({createdAt : -1});
                if(allProductDetails.length < 0){
                    req.session.productNotFound = true
                }

            //generate pagination links
            const paginationLinks = [];
            for (let i = 1; i <= totalPages; i++) {
                //generate links only for pages with products
                if (i <= totalPages) {
                    paginationLinks.push({
                        page: i,
                        url: `/womens-watches?page=${i}`,
                        isActive: i === pageNum
                    });
                }
            }
            console.log('paginationLinks',paginationLinks);
            console.log('totalProducts,totalPages',{ totalProducts, totalPages }); 

            //sort section
            const { sortBy = 'productName', order = 'asc' } = req.query;
            if(!['productName', 'lastPrice'].includes(sortBy)) {
                return res.status(400).send('Invalid sortBy parameter');
            }
            if(!['asc', 'desc'].includes(order)) {
                return res.status(400).send('Invalid order parameter');
            }

            console.log('sortBy',sortBy, 'order',order);

            const products = await productDB.find({ unlisted: false })
            .sort({ [sortBy]: order })
            .exec();
            console.log('Final MongoDB query:', products.toString());
            // /sort section

            //cart count in cart icon
            const cartCount = await shoppingCartDB.countDocuments({email: userEmail})
            console.log(cartCount);


            // *********cate/product offer section*********
            const categoryOfferExist = await categoryOfferDB.findOne({category: 'women', unlisted:false, expDate: {$gt: new Date()}});
            console.log(categoryOfferExist);

            let categoryDiscInPercentage = 0
            if(categoryOfferExist) {
                console.log("category offer exist in mens watches page");
                console.log("offer in Category:", categoryOfferExist.category);
                console.log("Discount:", categoryOfferExist.discount);
                categoryDiscInPercentage = categoryOfferExist.discount
            }else{
                console.log("category offer not exist");
            }
           // ***********/cate/product offer section************

            res.render("womens_watches", { categoryOfferExist, categoryDiscInPercentage,
                  products, cartCount,
                pageTitle: 'Womens Watches',
                page: '/womens-watches',
                paginationLinks,
                currentPage: pageNum,
                totalPages,
                productNotFound:req.session.productNotFound,
                userName: result ? result.name : 'User not found',
                userLoggined: isUserAuthenticated,
                allCategoryDetails,
                allProductDetails
            });
        }catch(error) {
            console.error('Error fetching products from MongoDB:', error);
            res.status(500).send('Internal Server Error');
        }
    },
};


//shopping-cart - GET
const getShoppingCart = {
    async shoppingCart(req, res) {
        try {
            const { userEmail } = req.session;

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
            ]).sort({createdAt : -1});

            if (cartProductDetails) {
                console.log("cartProductDetails found");
                cartProductDetails.forEach(product => {
                    console.log(product);
                })
            }

            const result = await userdbCollection.findOne({ email: userEmail });
            if (result) {
                console.log('User data: ', result.name, result.email);
            } else {
                console.log('User not found');
            }

            const QuantityData = await shoppingCartDB.find();
            console.log("QuantityData", QuantityData);
            if (QuantityData) {
                console.log('user added qty data: ', QuantityData.userAddedQuantity);
            } else {
                console.log('product not found in shoppingcartdb');
            }

            const { isUserAuthenticated } = req.session;

            //cart count in cart icon
            const cartCount = await shoppingCartDB.countDocuments({email: userEmail})
            console.log(cartCount);

            res.render('shopping_cart', {cartCount, userName: result ? result.name : 'User not found', QuantityData, cartProductDetails ,
                         userLoggined: isUserAuthenticated,}, (err, html) => {
                if (err) {
                    res.status(500).send('Render err' + err.message);
                }

                res.send(html);
            });
        }catch(error) {
            console.error('Error fetching product details:', error);
            res.status(500).send("Internal server error", + error.message);
        }
    },
};


//delivery-address - GET
const getPaymentDeliveryDetails = {
    async paymentDeliveryDetails(req, res) {
        try {
            const { productId, price, quantity } = req.query;
            const { userEmail } = req.session;

            const userAddressDetails = await AddressDB.find({ email: userEmail }).sort({ createdAt: -1 });

            const Result = await userdbCollection.findOne({ email: userEmail });
            if (Result) {
                console.log('User data', userEmail, Result.name, Result.email, Result.phno);
            } else {
                console.log('User not found');
            }

            //get shopping cart section
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
            if(cartProductDetails) {
                console.log('Cart product details found');
                cartProductDetails.forEach(product => {
                        console.log('cart product', product);
                });
            }else{
                console.log('No cart product details found for the user.');
            }

            const result = await userdbCollection.findOne({ email: userEmail });
            if(result) {
                console.log('User data: ', result.name, result.email);
            }else{
                console.log('User not found');
            }

            // coupon handling
            console.log(" 'address page' render coupon data, user total cart amount");
            const allCouponDetails = await couponDB.find();
            console.log(allCouponDetails);
            // /coupon

            const QuantityData = await shoppingCartDB.find();
            console.log("QuantityData", QuantityData);
            if(QuantityData){
                console.log('QuantityData', QuantityData.userAddedQuantity);
            }else{
                console.log('productId not found in cart');
            }
            const { isUserAuthenticated } = req.session;

            //cart count in cart icon
            const cartCount = await shoppingCartDB.countDocuments({email: userEmail})
            console.log(cartCount);

            res.render('checkout_address', { cartCount,
                allCouponDetails, userAddressDetails, userName: Result.name, userName: result ? result.name : 'User not found',
                QuantityData, cartProductDetails, userLoggined: isUserAuthenticated
            }, (err, html) => {
                if(err){
                    res.status(500).send('Render err' + err.message);
                }

                res.send(html);
            });
        } catch (error) {
            console.error('Error fetching product details:', error);
            res.status(500).send("Internal server error", + error.message);
        }
    },
};


//checkout-addAddress - GET
const checkoutAddAddress = {
    async addAddress(req, res) {
        try{
            //add-address sec
            const { userEmail } = req.session;
            const result = await userdbCollection.findOne({ email: userEmail });
            if (result) {
                console.log('User data: ', result.name, result.email);
            } else {
                console.log('User not found');
            }
            //add-address sec

            //get shopping cart section(for payment details)
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
            if(cartProductDetails){
                console.log('Cart product details found');
            }else{
                console.log('No cart product details found for the user.');
            }

            const QuantityData = await shoppingCartDB.find();
            if(QuantityData){
                console.log('QuantityData', QuantityData.userAddedQuantity);
            }else{
                console.log('productId not found in cart');
            }

            //cart count in cart icon
            const cartCount = await shoppingCartDB.countDocuments({email: userEmail})
            console.log(cartCount);

            const {checkoutAddressInvalidPin,checkoutAddressInvalidState, checkoutAddressNotvalidState,
                checkoutAddressInvalidAddress,checkoutAddressInvalidDistrict,checkoutAddressNotnvalidDistrict,invalidMobile} = req.session;

            const { isUserAuthenticated } = req.session; 

            res.render('checkout_addAddress', { cartCount, checkoutAddressInvalidPin, checkoutAddressInvalidState, checkoutAddressNotvalidState,
                                        checkoutAddressInvalidAddress, checkoutAddressInvalidDistrict, checkoutAddressNotnvalidDistrict,
                                        invalidMobile, userName: result ? result.name : 'User not found',QuantityData, cartProductDetails,
                                        userLoggined: isUserAuthenticated}, (err, html) => {
                if(err){
                    res.status(500).send('Render err' + err.message);
                }

                delete req.session.checkoutAddressInvalidPin;
                delete req.session.checkoutAddressInvalidState;
                delete req.session. checkoutAddressNotvalidState;
                delete req.session.checkoutAddressInvalidAddress;
                delete req.session.checkoutAddressInvalidDistrict;
                delete req.session.checkoutAddressNotnvalidDistrict;
                delete req.session.invalidMobile;

                res.send(html);
            });
        }catch(error) {
            console.error('Error fetching product details:', error);
            res.status(500).send("Internal server error", + error.message);
        }
    },
};


//checkout-editAddress - GET
const checkoutEditAddress = {
    async updateAddress(req, res) {
        try {
            const { userEmail } = req.session;
            const result = await userdbCollection.findOne({ email: userEmail });
            if(result){
                console.log('User data: ', result.name, result.email);
            }else{
                console.log('User not found');
            }

            const { id } = req.params;

            let userAddressDetails;
            if (req.session.currentAddressDetails) {
                userAddressDetails = [req.session.currentAddressDetails];
                delete req.session.currentAddressDetails;
            } else {
                userAddressDetails = await AddressDB.find({ _id: id });
            }
            
            //get shopping cart section(for payment details)
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
            if (cartProductDetails) {
                console.log('Cart product details found');
            } else {
                console.log('No cart product details found for the user.');
            }

            const QuantityData = await shoppingCartDB.find();
            console.log("QuantityData", QuantityData);
            if (QuantityData) {
                console.log('QuantityData', QuantityData.userAddedQuantity);
            } else {
                console.log('productId not found in cart');
            }
            // /shopping cart section(for payment details)
            
            const {checkoutAddressInvalidPin,checkoutAddressInvalidState, checkoutAddressNotvalidState,
                checkoutAddressInvalidAddress,checkoutAddressInvalidDistrict,checkoutAddressNotnvalidDistrict,invalidMobile} = req.session;
            const { isUserAuthenticated } = req.session;   

            //cart count in cart icon
            const cartCount = await shoppingCartDB.countDocuments({email: userEmail})
            console.log(cartCount);

            res.render('checkout_editAddress', { cartCount,
                            userAddressDetails,checkoutAddressInvalidPin, checkoutAddressInvalidState, checkoutAddressNotvalidState,
                            checkoutAddressInvalidAddress, checkoutAddressInvalidDistrict, checkoutAddressNotnvalidDistrict,
                            invalidMobile, userName: result ? result.name : 'User not found',QuantityData, cartProductDetails,
                            userLoggined: isUserAuthenticated}, (err, html) => {
                if(err) {
                    res.status(500).send('Render err' + err.message);
                }
                delete req.session.checkoutAddressInvalidPin;
                delete req.session.checkoutAddressInvalidState;
                delete req.session. checkoutAddressNotvalidState;
                delete req.session.checkoutAddressInvalidAddress;
                delete req.session.checkoutAddressInvalidDistrict;
                delete req.session.checkoutAddressNotnvalidDistrict;
                delete req.session.invalidMobile;

                res.send(html);
            });
        }catch(error) {
            console.error('Error fetching product details:', error);
            res.status(500).send("Internal server error", + error.message);
        }
    },
};


// checkout-paymentMode -GET
const getPaymentMethod = {
    async paymentType(req, res) {
        try {
            const { userEmail } = req.session;
            
            console.log('selected payment type (in checkout payament page)',req.session.selectedPaymentType);
            const { selectedAddressId , selectedPaymentType} = req.session;
            const selectedAddressDetails = await AddressDB.findOne({ _id: selectedAddressId })
            console.log("selectedAddressDetails found in the payment-type page", selectedAddressDetails);

            //cart count in cart icon
            const cartCount = await shoppingCartDB.countDocuments({email: userEmail})
            console.log(cartCount);

            const userAddressDetails = await AddressDB.find({});
            // ***** render no-address page ******
            if (userAddressDetails.length === 0) {
                res.render('address_image',{cartCount}, (err, html) => {
                    if (err) {
                        return res.send('Render error');
                    }
                    res.send(html);
                });
            }
            // ***** /render no-address page ******

            if(userAddressDetails){
                console.log("addresses :", userAddressDetails);
            }else{
                console.log('Address not found');
            }

            const Result = await userdbCollection.findOne({ email: userEmail });
            if (Result) {
                console.log('User data: ', Result.name, Result.email, Result.phno);
            } else {
                console.log('User not found');
            }

            //get shopping cart section
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
            if (cartProductDetails) {
                console.log('cart product details found');
            }

            const result = await userdbCollection.findOne({ email: userEmail });
            if(result){
                console.log('User data: ', result.name, result.email);
            }else{
                console.log('User not found');
            }

            const QuantityData = await shoppingCartDB.find();
            if(QuantityData){
                console.log('QuantityData', QuantityData);
            }else{
                console.log('productId not found in cart');
            }

            
            const selectedAddressID = req.query.selectedAddressId;
            console.log("selected payment in payment page***876", req.session.selectedPaymentType ); 
            
            const { isUserAuthenticated, totalPriceAfterCouponDiscount, discountAmountInNumber} = req.session;
            console.log("", totalPriceAfterCouponDiscount, discountAmountInNumber);

            let { successMessageDisplayed, codNotApplicable } = req.session;
            // use cod above 1000 orders message
            let messageDisplayed = successMessageDisplayed;
            if(codNotApplicable && !messageDisplayed) {
                successMessageDisplayed = true;       
            }else{
                successMessageDisplayed = false;
                messageDisplayed = false;
            }
            console.log("cod not applicable", req.session.codNotApplicable);
            
            res.render('payment_method', {codNotApplicable, totalPriceAfterCouponDiscount, discountAmountInNumber, cartCount, 
                            newTotalPrice: req.session.newTotalPrice, userEmail, orderId:req.session.orderId,
                             selectedPaymentType,selectedAddressID, userAddressDetails,
                            userName: Result.name,userName: result ? result.name : 'User not found', QuantityData,
                            cartProductDetails, userLoggined: isUserAuthenticated}, (err, html) => {
                if(err){
                    res.status(500).send('Render error' + err.message);
                }
                delete req.session.codNotApplicable;

                res.send(html);
            });
        }catch(error){
            console.error('Error fetching product details:', error);
            res.status(500).send("Internal server error", + error.message);
        }
    },
};


//order-placed success page - GET
const getOrderSuccess = {
    async orderPlaced(req, res) {
        try {
            const { userEmail } = req.session;
            const result = await userdbCollection.findOne({ email: userEmail });
                if(result) {
                    console.log('User data: ', result.name, result.email);
                }else{
                    console.log('User not found');
                }

            const { isUserAuthenticated } = req.session;

            //cart count in cart icon
            const cartCount = await shoppingCartDB.countDocuments({email: userEmail})
            console.log(cartCount);

            res.render('orderPlacedSuccessfull', { cartCount,
                userName: result ? result.name : 'User not found',userLoggined: isUserAuthenticated
                }, (err, html) => {
                    if(err) {
                        return res.send('Render error');
                    }
                res.send(html);
            });
        }catch(error) {
            console.error('Error fetching product details:', error);
            res.status(500).send('Internal Server Error');
        }
    },
};


//order-success,payment-failed page - GET
const getPaymentFailed = {
    async paymentNotCompleted(req, res) {
        try {
            const { userEmail } = req.session;
            const result = await userdbCollection.findOne({ email: userEmail });
                if(result) {
                    console.log('User data: ', result.name, result.email);
                }else{
                    console.log('User not found');
                }

            const { isUserAuthenticated } = req.session;
            res.render('payment_failed', {userName: result ? result.name : 'User not found',
                                        userLoggined: isUserAuthenticated
                }, (err, html) => {
                    if(err) {
                        return res.send('Render error');
                    }
                    res.send(html);
                });
        }catch(error) {
            console.error('Error fetching product details:', error);
            res.status(500).send('Internal Server Error');
        }
    },
};


//user-orders - GET
const getOrders = {
    async userOrders(req, res) {
        try {
            const { userEmail } = req.session;
            const result = await userdbCollection.findOne({ email: userEmail });
                if(result){
                    console.log('User data: ', result.name, result.email, result.phno);
                }else{
                    console.log('User not found');
                }

            const OrderData = await Orderdb.find({ email: userEmail }).sort({createdAt : -1});
            console.log("user OrderData: ", OrderData);
            console.log('payment status in order page',OrderData.paymentstatus);

            const { orderCancelled, isUserAuthenticated } = req.session;

            //cart count in cart icon
            const cartCount = await shoppingCartDB.countDocuments({email: userEmail})
            console.log(cartCount);
               
            res.render('orders', { cartCount, orderCancelled: orderCancelled, OrderData, userName: result.name,
                                 userEmail: result.email, userLoggined: isUserAuthenticated }, (err, html) => {
                if (err) {
                    console.error(err); 
                    return res.status(500).send('Render error');
                }
                                
                delete req.session.orderCancelled;
                res.send(html);
            });
        }catch(error) {
            console.error('Error retrieving user: ', error);
        }
    },
};


//retryPaymentSuccess - GET
const getretryPaymentSuccess = {
    async orderPayment(req, res) {
        try {
            const { userEmail } = req.session;
            const result = await userdbCollection.findOne({ email: userEmail });
                if(result) {
                    console.log('User data: ', result.name, result.email);
                }else{
                    console.log('User not found');
                }

            const { isUserAuthenticated } = req.session;

            //cart count in cart icon
            const cartCount = await shoppingCartDB.countDocuments({email: userEmail})
            console.log(cartCount);

            res.render('retryPayment_success', { cartCount,
                userName: result ? result.name : 'User not found',userLoggined: isUserAuthenticated
            }, (err, html) => {
                if(err) {
                    return res.send('Render error');
                }
                res.send(html);
            });
        }catch(error) {
            console.error('Error fetching product details:', error);
            res.status(500).send('Internal Server Error');
        }
    },
};


//order-summary - GET
const getOrdersummary = {
    async userOrdersummary(req, res) {
        try {
            const { userEmail } = req.session;
            const result = await userdbCollection.findOne({ email: userEmail });
                if(result){
                    console.log('User data: ', result.name, result.email);
                }else{
                    console.log('User not found');
                }

            const { isUserAuthenticated } = req.session;
            
            res.render('userOrderSummaryPage', { userName: result ? result.name : 'User not found', userLoggined: isUserAuthenticated }, (err, html) => {
                if (err) {
                    return res.send('Render error');
                }
                res.send(html);
            });
        }catch(error) {
            console.error('Error fetching product details:', error);
            res.status(500).send('Internal Server Error');
        }
    },
};


//download-invoice - GET
const getDownloadInvoice = {
    async downloadInvoice(req, res) {
        console.log("in invoice section", req.query.invoiceProductId, req.query.invoiceOrderId);
        const {invoiceOrderId , invoiceProductId} = req.query;
        
        const result = await Orderdb.findOne({ _id: invoiceOrderId, 'orderItems._id': invoiceProductId }, { 'orderItems.$': 1 }).exec();
        let productData = null;
        let finalAmount  = 0;
        let totalDiscInNums = 0;
        let userAddedQty = 0
        
        const foundProduct = result.orderItems[0];
        console.log('Found product in orderDb:', foundProduct);
        console.log("Product ID:", foundProduct.productId);
        
        console.log("user added qty", foundProduct.userAddedQty);
        userAddedQty = foundProduct.userAddedQty;

        productData = await productDB.findOne({ _id: foundProduct.productId });
        let productName= foundProduct.pName;
        console.log("productName", productName);
        let totalMRP = foundProduct.firstPrice * userAddedQty
        console.log("totalMRP", totalMRP);
        if(productData) {
            console.log('productData : ', productData);
            
            console.log("product name",foundProduct.pName);
            console.log("userAddedQty", userAddedQty);
            console.log("total discount", productData.discount );
            
            console.log("final price",productData.firstPrice);
            
            let pfirstPrice = productData.firstPrice

            if(productData.productofferDiscount && productData.categoryofferDiscount){
                console.log("have both offers");
                console.log(productData.productofferDiscount );
                console.log(productData.categoryofferDiscount );
                console.log( productData.discount );
                const finalizeDisc = productData.productofferDiscount > productData.categoryofferDiscount ? productData.productofferDiscount : productData.categoryofferDiscount;
                const totalDiscpercentage = finalizeDisc + productData.discount;

                totalDiscInNums = (pfirstPrice * totalDiscpercentage ) / 100;
                let onePPrice = pfirstPrice - totalDiscInNums
                finalAmount = onePPrice * userAddedQty;

            }else if(productData.productofferDiscount){
                console.log("have product offer");
                console.log(productData.productofferDiscount );
                console.log( productData.discount );
                
                const totalDiscpercentage = productData.productofferDiscount + productData.discount;
                console.log("totalDiscpercentage", totalDiscpercentage);
                totalDiscInNums = (pfirstPrice * totalDiscpercentage ) / 100;
                console.log("totalDiscInNums", totalDiscInNums);
                console.log("pfirstPrice", pfirstPrice);
                let onePPrice = pfirstPrice - totalDiscInNums
                finalAmount = onePPrice * userAddedQty;
                console.log("finalAmount", finalAmount);
                console.log("finalAmount", finalAmount * userAddedQty);
            }else if(productData.categoryofferDiscount){
                console.log("have category offer");
                console.log(productData.categoryofferDiscount );
                console.log( productData.discount );
                
                const totalDiscpercentage = productData.categoryofferDiscount + productData.discount;
                console.log("totalDiscpercentage", totalDiscpercentage);
                totalDiscInNums = (pfirstPrice * totalDiscpercentage ) / 100;
                console.log("totalDiscInNums", totalDiscInNums);
                console.log("pfirstPrice", pfirstPrice);
                let onePPrice = pfirstPrice - totalDiscInNums
                finalAmount = onePPrice * userAddedQty;
                console.log("finalAmount", finalAmount);
                console.log("finalAmount", finalAmount * userAddedQty);
            }else{
                console.log("have no specific offer");
                console.log( productData.discount );
                totalDiscInNums = (pfirstPrice * productData.discount ) / 100;
                let onePPrice = pfirstPrice - totalDiscInNums
                finalAmount = onePPrice * userAddedQty;
            }
        }

        console.log('totalDiscInNums',totalDiscInNums);
        console.log("finalAmount",finalAmount);

        const orderData = await Orderdb.findOne({ _id: invoiceOrderId})
        console.log("for date", orderData.orderDate);
        
        const dateString = orderData.orderDate;   //date string
        const date = new Date(dateString);   //create a date object from the string

        const formattedDate = date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric' 
        });
        console.log('order date',formattedDate);

        const userEmail = orderData.email;
        const userData = await userdbCollection.findOne({email: userEmail});
        const userName = userData.name;

        const orderAddress = orderData.selectedAddress[0];
        console.log("addressData.", orderAddress);
        let userAddress= orderAddress.address;
        let userMobile = orderAddress.mobile;
        
        const currentDate = new Date();
        const invoiceDate = currentDate.toLocaleDateString('en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        console.log("invoiceDate",invoiceDate);

        //function to generate PDF
        async function generatePDF(data) {
            const browser = await puppeteer.launch({ 
                headless: "new",
                executablePath: '/snap/bin/chromium',
              });
            const page = await browser.newPage();

            //load the ejs template
            const templatePath = path.join( 'views', 'invoice.ejs');
            const template = fs.readFileSync(templatePath, 'utf8');

            //render template with dynamic data
            const html = ejs.render(template, data);

            //set the html content of the page
            await page.setContent(html);

            //generate the pdf
            const pdfOptions = {
                format: 'A4',
                printBackground: true,
            };
            const pdf = await page.pdf(pdfOptions);
            await browser.close();
            return pdf;
        }

        //simulate invoice data
        const data = {
            heading:"Invoice",
            orderId: invoiceOrderId,
            orderDate: formattedDate,
            invoiceDate: invoiceDate,
            userName: userName,
            userAddress :userAddress,
            userMobile : userMobile,
            productName : productName,
            userAddedQty : userAddedQty,
            totalMRP : totalMRP,
            totalDiscInNums : totalDiscInNums,
            finalAmount :finalAmount,
            gratitude:"Thank You!",
            txt:"for shopping with Us"
        };
        console.log("invoice data",userName, userMobile, userAddedQty);

        try{
            const pdf = await generatePDF(data);
            res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdf.length });
            res.send(pdf);
        }catch(error){
            console.error('Error generating invoice:', error);
            res.status(500).send('Error generating invoice');
        }
    },
};


//wishlist - GET
const getWishlist = {
    async wishlist(req, res) {
        try {
            const { isUserAuthenticated, userEmail} = req.session;

            const result = await userdbCollection.findOne({ email: userEmail });
            if(result){
                console.log('data', result.name, result.email);
            }else{
                console.log('User not found');
            }

            const wishlistProductDetails = await wishlistDB.aggregate([
                {
                    '$lookup': {
                        'from': 'productdbs',
                        'localField': 'productId',
                        'foreignField': '_id',
                        'as': 'proDetails'
                    }
                },
            ]).sort({createdAt : -1});

            //cart count in cart icon
            const cartCount = await shoppingCartDB.countDocuments({email: userEmail})
            console.log(cartCount);

            res.render('wishlist', { cartCount, wishlistProductDetails, userName: result ? result.name : 'User not found',
                                    userEmail: result.email,userLoggined: isUserAuthenticated
            }, (err, html) => {
                if (err) {
                    console.error(err)
                    return res.send('Render error');
                }
                res.send(html);
            });
        } catch (error) {
            console.error('Error fetching wishlist details:', error);
            res.status(500).send("Internal server error");
        }
    },
};


//user_profile - GET
const getUserProfile = {
    async userProfile(req, res) {
        try{
            const { userEmail } = req.session;
            const result = await userdbCollection.findOne({ email: userEmail });
                if(result) {
                    console.log('User data: ', result.name, result.email, result.phno);
                    req.session.emailee = result.email
                } else {
                    console.log('User not found');
                }
            const { isUserAuthenticated } = req.session;  

            //cart count in cart icon
            const cartCount = await shoppingCartDB.countDocuments({email: userEmail})
            console.log(cartCount);

            console.log("user referal link", result.referralLink );
            res.render('user_profile', { cartCount, result, userGender: result.gender, userName: result.name, userLoggined: isUserAuthenticated,
                                userEmail: result.email, userNumber: result.phno }, (err, html) => {
                if(err){
                    return res.send('Render error');
                }
                res.send(html);
            });
        }catch(error) {
            console.error('Error retrieving user:', error);
        }
    },
};


//edit-profile - GET
const getUserEditProfile = {
    async EditProfile(req, res) {
        try {
            const { userEmail } = req.session;
            const result = await userdbCollection.findOne({ email: userEmail });
                if(result){
                    console.log('User data: ', result.name, result.email, result.phno);
                }else{
                    console.log('User not found');
                }

            const { invalidNumber, invalidName, notValidName, isUserAuthenticated } = req.session;

            //cart count in cart icon
            const cartCount = await shoppingCartDB.countDocuments({email: userEmail})
            console.log(cartCount);

            res.render('edit_profile', { cartCount,
                            notValidNameError: notValidName, invalidNameError: invalidName, invalidNoError: invalidNumber,
                            userGender: result.gender, userName: result.name, userEmail: result.email,
                            userNumber: result.phno, userLoggined: isUserAuthenticated }, (err, html) => {
                if(err) {
                    return res.send('Render error');
                }
                delete req.session.invalidNumber;
                delete req.session.invalidName;
                delete req.session.notValidName
                res.send(html);
            });
        } catch (error) {
            console.error('Error retrieving user data:', error);
        }
    },
};


//add-address - GET
const getAddAddress = {
    async userAddress(req, res) {
        try {
            const { userEmail } = req.session;
            const result = await userdbCollection.findOne({ email: userEmail });
            if(result){
                console.log('User data: ', result.name, result.email, result.phno);
            }else{
                console.log('User not found');
            }

            //cart count in cart icon
            const cartCount = await shoppingCartDB.countDocuments({email: userEmail})
            console.log(cartCount);

            const { isUserAuthenticated } = req.session;       

            const {invalidPinCode, invalidState, notValidState, invalidAddress, invalidDistrict, notValidDistrict, invalidMobile} = req.session;
            res.render('add_address', { cartCount,
                invalidPinCode, invalidState, notValidState, invalidAddress,
                invalidDistrict, notValidDistrict,invalidMobile,
                userName: result.name, userEmail: result.email,userLoggined: isUserAuthenticated
            }, (err, html) => {
                if(err){
                    return res.send('Render error');
                }
                delete req.session.invalidPinCode;
                delete req.session.invalidState;
                delete req.session.notValidState;
                delete req.session.invalidAddress;
                delete req.session.invalidDistrict;
                delete req.session.notValidDistrict;
                delete req.session.invalidMobile;
                
                res.send(html);
            });
        } catch (error) {
            console.error('Error retrieving user data:', error);
        }
    },
};

//user-address -GET
const getUserAddress = {
    async userAddress(req, res) {
        try {
            const { userEmail } = req.session;

            const userAddressDetails = await AddressDB.find({ email: userEmail }).sort({ createdAt: -1 });
            // ******render no-address page******
            if (userAddressDetails.length === 0) {
                res.render('address_image', (err, html) => {
                    if (err) {
                        return res.send('Render error');
                    }
                    res.send(html);
                });
            }
            // ******/render no-address page******
            if(userAddressDetails) {
                console.log("all addresses of a user :", userAddressDetails);
            }else{
                console.log('Address not found');
            }

            const result = await userdbCollection.findOne({ email: userEmail });
            if (result) {
                console.log('User data: ', result.name, result.email, result.phno);
            } else {
                console.log('User not found');
            }

            const { isUserAuthenticated } = req.session;    
            
            //cart count in cart icon
            const cartCount = await shoppingCartDB.countDocuments({email: userEmail})
            console.log(cartCount);

            res.render('user_address', {cartCount,  userAddressDetails, userName: result.name, userLoggined: isUserAuthenticated }, (err, html) => {
                if (err) {
                    return res.send('Render error');
                }
                res.send(html);
            });
        }catch(error) {
            console.error('Error retrieving user data:', error);
        }
    },
};


//edit-address - GET
const getEditAddress = {
    async updateAddress(req, res) {
        try {
            const { userEmail } = req.session;
            const result = await userdbCollection.findOne({ email: userEmail });
            if(result){
                console.log('User data: ', result.name, result.email, result.phno);
            }else{
                console.log('User not found');
            }

            const { id } = req.params;
            const userAddressDetails = await AddressDB.find({ _id: id });
                if(userAddressDetails) {
                    console.log("all addresses of a user :", userAddressDetails);
                }else{
                    console.log('Address not found');
                }
            
            const {invalidPinCode,invalidStateName,invalidState,emptyAddress,invalidDistrictName,
                    invalidDistrict,invalidMobile, isUserAuthenticated} = req.session;

            //cart count in cart icon
            const cartCount = await shoppingCartDB.countDocuments({email: userEmail})
            console.log(cartCount);
                   

            res.render('edit_address', { cartCount,
                invalidPinCode,invalidStateName,invalidState,emptyAddress,invalidDistrictName,
                invalidDistrict,invalidMobile,userAddressDetails,userName: result.name, userLoggined: isUserAuthenticated
            }, (err, html) => {
                if (err) {
                    return res.send('Render error');
                }
                delete req.session.invalidPinCode;
                delete req.session.invalidStateName;
                delete req.session.invalidState;
                delete req.session.emptyAddress;
                delete req.session.invalidDistrictName;
                delete req.session.invalidDistrict;
                delete req.session.invalidMobile;
                res.send(html);
            });
        }catch(error) {
            console.error('Error retrieving user:', error);
        }
    },
};

//user-address -GET
const getAddressImage = {
    addressImage(req, res) {
        res.render('address_image')
    },
};


//user-address -GET
const getUserWallet = {
    async userWallet(req, res) {
        try {
            const { userEmail, isUserAuthenticated } = req.session;
            
            const result = await userdbCollection.findOne({ email: userEmail });
            if(result){
                console.log('User data: ', result.name, result.email, result.phno);
            }else{
                console.log('User not found');
            }
            
            //cart count in cart icon
            const cartCount = await shoppingCartDB.countDocuments({email: userEmail})
            console.log(cartCount);
            // /cart count in cart icon

            const userWalletData = await walletDB.findOne({email:userEmail}).sort({createdAt:-1});
            console.log(userWalletData);
            
            if(userWalletData && userWalletData.transactions) {
                //sort transactions in descending order
                userWalletData.transactions.sort((a, b) => b.transactionDate - a.transactionDate);
            
            }else{
                console.log("No transactions found for the user or user data not found.");
            }

            res.render('user_wallet', { userWalletData, cartCount, userName: result.name, userLoggined: isUserAuthenticated }, (err, html) => {
                if(err){
                    console.error('Render error:', err); 
                    return res.status(500).send('Render error: ' + err.message);
                }
                res.send(html);
            });
        }catch(error){
            console.error('Error retrieving user data:', error);
        }
    },
};


//order-placed success page - GET
const getWalletPaymentSuccess = {
    async paymentSuccess(req, res) {
        try {
            const { userEmail } = req.session;
            const result = await userdbCollection.findOne({ email: userEmail });
                if(result) {
                    console.log('User data: ', result.name, result.email);
                }else{
                    console.log('User not found');
                }

            const { isUserAuthenticated } = req.session;

            //cart count in cart icon
            const cartCount = await shoppingCartDB.countDocuments({email: userEmail})
            console.log(cartCount);

            res.render('walletPayment_success', { cartCount,
                userName: result ? result.name : 'User not found',userLoggined: isUserAuthenticated
            }, (err, html) => {
                if(err) {
                    return res.send('Render error');
                }
                res.send(html);
            });
        }catch(error) {
            console.error('Error fetching payment success page:', error);
            res.status(500).send('Internal Server Error');
        }
    },
};


//order-success,payment-failed page - GET
const getWalletPaymentFailed = {
    async paymentNotCompleted(req, res) {
        try {
            const { userEmail } = req.session;
            const result = await userdbCollection.findOne({ email: userEmail });
                if(result) {
                    console.log('User data: ', result.name, result.email);
                }else{
                    console.log('User not found');
                }

            const { isUserAuthenticated } = req.session;
            res.render('wallet_paymentFailed', {userName: result ? result.name : 'User not found',
                                        userLoggined: isUserAuthenticated
                }, (err, html) => {
                    if(err) {
                        return res.send('Render error');
                    }
                    res.send(html);
                });
        }catch(error) {
            console.error('Error fetching product details:', error);
            res.status(500).send('Internal Server Error');
        }
    },
};





module.exports = { getUserSignup, getOtpPage, getUserLogin, getHome, getForgotPsw, getPswSetup, getAllWatches, getSingleProduct,
                   getMenswatches, getWomenswatches, getShoppingCart, getPaymentDeliveryDetails, checkoutAddAddress, checkoutEditAddress,
                   getPaymentMethod, getPaymentFailed,getOrderSuccess, getOrders, getOrdersummary,getWishlist, getUserProfile,
                   getUserEditProfile, getAddAddress,getUserAddress, getAddressImage, getEditAddress, getretryPaymentSuccess, getUserWallet,
                   getWalletPaymentSuccess, getWalletPaymentFailed, getDownloadInvoice, getResetPsw }

