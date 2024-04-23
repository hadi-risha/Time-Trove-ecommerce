const categoryDB = require("../model/categoryModel");
const userdbCollection = require("../model/model");
const productDB = require("../model/productModel");
const Orderdb = require("../model/orderModel")
const couponDB = require("../model/couponModel")
const ProductOfferDB = require("../model/offer-ProductModel")
const categoryOfferDB = require("../model/offer-CategoryModel")
const referralOfferDB = require("../model/referralModel")



/************* Admin side ****************/

//admin - GET   (login) 
const getAdminLogin = {
    adminLogin(req, res) {
        const {invalidCredentials} = req.session;
        res.render('admin',{ adminPassError:invalidCredentials}, (error,data) =>{
            if(error){
                return res.status(500).send("Internal server error");
            }
            delete req.session.invalidCredentials;
            res.send(data);
        });
    },
};


//adminHome - GET
const getAdminHome = {
    async adminHome(req, res) {
    try{
        const totalUsers = await userdbCollection.countDocuments();
        
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const latestOrders = await Orderdb.countDocuments({
            orderDate: {
                $gte: startOfMonth,
                $lt: endOfMonth
            }
        });

        const totalSales = await Orderdb.aggregate([
            {
                $group: {
                    _id: null, 
                    total: { $sum: "$finalAmount" }
                }
            }
        ]);

        console.log("lasted orders based on this month", latestOrders);

        const totalSalesAmount = totalSales.length > 0 ? totalSales[0].total : 0;
        console.log('Total sales amount:', totalSalesAmount);

        const {adminPassnotMatch} = req.session;
        res.render("admin_dashboard",{ totalSalesAmount , latestOrders, totalUsers , AdminPassError:adminPassnotMatch },)
    }catch(err){
        console.error('Error fetching user/order details from MongoDB:', err);
        res.status(500).send('Internal Server Error');
    }
    }
}


//user-management - GET
const getuserManagement = {
    uManagement: async (req, res) => {
        try{
            const email = req.query.email;
            const userDetails = await userdbCollection.find().sort({createdAt : -1});

            const duplicateuserDetails = [...userDetails]
            const userDetailsJson = JSON.stringify(duplicateuserDetails);
            res.render('user_management', { userDetailsJson,userDetails });
        }catch(err) {
            console.error('Error fetching user details from MongoDB:', err);
            res.status(500).send('Internal Server Error');
        }
    },
};


//user-management - GET
const getUserSearchResult = {
    userManagement: async (req, res) => {
        try{
            const query = req.query.q;
            console.log('Received query:', query);
            if (!query) {
                return res.status(400).send({ error: 'query parameter is missing' });
            }

            //perform search
            const users = await userdbCollection.find({
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { email: { $regex: query, $options: 'i' } },
                ],
                verified: { $in: [true, false] }, 
                isBlocked: { $in: [true, false] },
            }).exec();
            console.log('Results:', users);
            res.json(users);
        }catch(err) {
            console.error('Error fetching user details from MongoDB:', err);
            res.status(500).send('Internal Server Error');
        }
    },
};


//add-product - GET
const getAdminAddProduct = {
    async addProduct(req, res) {
        try{
            const allCategories = await categoryDB.find();

            //product added success message
            let {productAdded,successMessageDisplayed} = req.session;
            let messageDisplayed = successMessageDisplayed;
                if(productAdded && !messageDisplayed) {                  
                    successMessageDisplayed = true;       //create session for displaying sccss msg
                }else{
                    successMessageDisplayed = false;
                    messageDisplayed = false;
                }

            //duplicate product name found
            let {duplicateProductName,succssMsgDisplayed} = req.session;
            let msgDisplayed = succssMsgDisplayed;
                if(duplicateProductName && !msgDisplayed) {                  
                    succssMsgDisplayed = true;       //create session for displaying sccss msg
                }else{
                    succssMsgDisplayed = false;
                    msgDisplayed = false;
                }

            const { invalidlPrice, invalidfPrice, invalidImage, invalidproductName,notValidpName,
                    emptypDescription,negativeFPrice,invalidFPrice,negativeLPrice,invalidLPrice,
                    negativeDiscountValue,notValidDiscount,invalidPercentage,invalidDiscount,
                    negativeQtyValue, invalidQtyValue} = req.session;

            res.render("add_product", { duplicateProductName, msgDisplayed, invalidproductName,notValidpName,emptypDescription,negativeFPrice,invalidFPrice,
                                    negativeLPrice,invalidLPrice,negativeDiscountValue,notValidDiscount,invalidPercentage,
                                    invalidDiscount, negativeQtyValue, invalidQtyValue,invalidlPrice : invalidlPrice,
                                    invalidfPrice : invalidfPrice, invalidImage : invalidImage,addproductSuccess : productAdded,
                                    messageDisplayed, allCategories }, (error,data) =>{
                if (error) {
                    return res.status(500).send("Internal server error");
                }
                succssMsgDisplayed = false;
                delete req.session.duplicateProductName;

                successMessageDisplayed = false;
                delete req.session.productAdded;
                delete req.session.invalidImage;
                delete req.session.invalidlPrice;
                delete req.session.invalidfPrice;

                delete req.session.invalidproductName;
                delete req.session.notValidpName;
                delete req.session.emptypDescription;
                delete req.session.negativeFPrice;
                delete req.session.invalidFPrice;
                delete req.session.negativeLPrice;
                delete req.session.invalidLPrice;
                delete req.session.negativeDiscountValue;
                delete req.session.notValidDiscount;
                delete req.session.invalidPercentage;
                delete req.session.invalidDiscount;
                delete req.session.negativeQtyValue;
                delete req.session.invalidQtyValue;

                res.send(data);
            });
        }catch(error) {
            console.error('Error fetching category details from MongoDB:', error);
            res.status(500).send('Internal Server Error');
        }
    },
};


//adminProductManagement - GET   
const getProductManagement = {
    async productManage (req, res) {
        try {
            const allProductDetails = await productDB.find({unlisted:false}).sort({createdAt : -1}); 

            //product updated success message
            let {productUpdated, successMessageDisplayed} = req.session;
            let messageDisplayed = successMessageDisplayed;
                if (productUpdated && !messageDisplayed) {                       
                    successMessageDisplayed = true;       //create session for displaying sccss msg
                }
                else {
                    successMessageDisplayed = false;
                    messageDisplayed = false;
                }

            //product deleted success message
            let {productDeleted} =req.session;
            let deletedMessageDisplayed = req.session.deletedMessageDisplayed;
                if (productDeleted && !deletedMessageDisplayed) {                  
                    req.session.successMessageDisplayed = true;       //create session for displaying sccss msg
                }
                else{
                    req.session.deletedMessageDisplayed = false;
                    deletedMessageDisplayed = false;
                }










            const categoryOfferExist = await categoryOfferDB.findOne({category: 'men',unlisted:false, expDate: {$gt: new Date()}});
            console.log('hgcat off',categoryOfferExist);

            
            let categoryDiscInPercentage = 0
            if(categoryOfferExist) {
                console.log("category offer exist");
                console.log("offer in Category:", categoryOfferExist.category);
                console.log("Discount:", categoryOfferExist.discount);
                categoryDiscInPercentage = categoryOfferExist.discount
            }else{
                console.log("category offer not exist");
            }
            // ***********/cate/product offer section************

            // allProductDetails.forEach(product => {
            //     console.log('show mens all watches',allProductDetails);
            // })

            // res.render("mens_watches", {  categoryOfferExist, categoryDiscInPercentage,












            res.render("product_management", {productDeleteSuccess : productDeleted, deletedMessageDisplayed,
                            updateproductSuccess: productUpdated,messageDisplayed, allProductDetails,
                             categoryOfferExist, categoryDiscInPercentage }, (error,data) =>{ 
                if(error){
                    console.error('Error rendering product_management template:', error);
                    return res.status(500).send("Internal server error");
                }
                req.session.deletedMessageDisplayed = false;
                delete req.session.productDeleted;
                successMessageDisplayed = false;
                delete req.session.productUpdated;

                res.send(data);
            });
        }catch(error) {
            console.error('Error fetching products details from MongoDB:', error);
            res.status(500).send('Internal Server Error');
        }
    },
};


//adminUnlisted-product - GET
const getAdminUnlistedProduct = {
    async unlistedProduct (req, res) {
        try {
            const allProductDetails = await productDB.find({unlisted:true}).sort({createdAt : -1}); 

            //product recovered success message
            let {productRecovered, successMessageDisplayed} = req.session;
            let messageDisplayed = successMessageDisplayed;
                if(productRecovered && !messageDisplayed) {                      
                    successMessageDisplayed = true;       //create session for displaying sccss msg
                }
                else{
                    successMessageDisplayed = false;
                    messageDisplayed = false;
                }

            res.render("unlisted_product",{productRecoverSuccess : productRecovered, messageDisplayed, allProductDetails }, (error,data) =>{ 
                if(error) {
                    console.error('Error rendering unlisted_product template:', error);
                    return res.status(500).send("Internal server error");
                }
                successMessageDisplayed = false;
                delete req.session.productRecovered;
                res.send(data);
            });
        }catch(error) {
            console.error('Error fetching unlisted products from MongoDB:', error);
            res.status(500).send('Internal Server Error');
        }
    },
};


//update-product - GET  
const getUpdateProduct = {
    async updateProduct(req, res) {
        try {
            const productId = req.query.productId;    
            const updateProductDetails = await productDB.findOne({ _id: productId });   
                console.log('details before updation',updateProductDetails);
            
            const allCategories = await categoryDB.find(); 

            const {imagenotvalid, enterValidProductName,notValidProName,emptypDscrptn,negativeFirstPrice,invalidFirstPrice,
                    negativeLastPrice,invalidLastPrice,negativeDiscount,notValidDscnt,notValidPercentage,
                    invalidDiscnt, negativeQty, invalidQty} = req.session;
            res.render("update_product", { enterValidProductName,notValidProName,emptypDscrptn,negativeFirstPrice,invalidFirstPrice,
                                            negativeLastPrice,invalidLastPrice,negativeDiscount,notValidDscnt,notValidPercentage,
                                            invalidDiscnt, negativeQty, invalidQty,imagenotvalid : imagenotvalid, updateProductDetails,
                                            allCategories },(error,data) =>{
                if(error) {
                    console.error('error rendering update_product template:', error);
                    return res.status(500).send("Internal server error");
                }
                delete req.session.imagenotvalid
                delete req.session.enterValidProductName;
                delete req.session.notValidProName;
                delete req.session.emptypDscrptn;
                delete req.session.negativeFirstPrice;
                delete req.session.invalidFirstPrice;
                delete req.session.negativeLastPrice;
                delete req.session.invalidLastPrice;
                delete req.session.negativeDiscount;
                delete req.session.notValidDscnt;
                delete req.session.notValidPercentage;
                delete req.session.invalidDiscnt;
                delete req.session.negativeQty;
                delete req.session.invalidQty;

                res.send(data);
            });
        }catch(error) {
            console.error('Error fetching details:', error);
            res.status(500).send('Internal Server Error');
        }
    },
};


//category-management - GET
const getCategoryManagement = {
    async categoryManagement(req, res) {
        try {
            const allCategories = await categoryDB.find({unlisted:false}).sort({createdAt: -1});

            // category deleted message
            let {categoryDeleted, successMessageDisplayed} =req.session;
            let messageDisplayed = successMessageDisplayed;
                if(categoryDeleted && !messageDisplayed) {                       
                    successMessageDisplayed = true;       //create session for displaying sccss msg
                }else{
                    successMessageDisplayed = false;
                    messageDisplayed = false;
                }
            
            // category updated message
            const {updatedCategory} = req.session;
            let msgDisplayed = req.session.MessageDisplayed;
                if (updatedCategory && !msgDisplayed) {                   
                    req.session.MessageDisplayed = true;       //create session for displaying sccss msg
                }
                else {
                    req.session.MessageDisplayed = false;
                    msgDisplayed = false;
                }

            res.render("category_management", {msgDisplayed, updatedCategorySuccess : updatedCategory, categoryDeleteSuccess : categoryDeleted,
                                                messageDisplayed, allCategories },  (error,data) =>{ 
                if(error){
                    console.error('Error rendering category_management template:', error);
                    return res.status(500).send("Internal server error");
                }
                successMessageDisplayed = false;
                delete req.session.categoryDeleted;
                req.session.MessageDisplayed = false;
                delete req.session.updatedCategory;

                res.send(data);
            }); 
        }catch(error) {
            console.error('Error fetching category data from MongoDB:', error);
            res.status(500).send('Internal Server Error');
        }
    },
};


//unlisted-category - GET 
const getUnlistedCategory = {
    async unlistedCategory(req, res) {
        try {
            const allCategories = await categoryDB.find({unlisted:true}).sort({createdAt: -1}); 

            // category recovered message
            let {categoryRecovered, successMessageDisplayed} = req.session;
            let messageDisplayed = successMessageDisplayed;
                if(categoryRecovered && !messageDisplayed) {                     
                    successMessageDisplayed = true;            //create session for displaying sccss msg
                }else{
                    successMessageDisplayed = false;
                    messageDisplayed = false;
                }
            
            res.render("unlisted_category",{categoryRecoverSuccess : categoryRecovered, messageDisplayed, allCategories}, (error,data) =>{ 
                if(error){
                    console.error('Error rendering unlisted_category template:', error);
                    return res.status(500).send("Internal server error");
                }
                successMessageDisplayed = false;
                delete req.session.categoryRecovered;
                res.send(data);
            }); 
        }catch(error) {
            console.error('Error fetching unlisted category data from MongoDB:', error);
            res.status(500).send('Internal Server Error');
        }
    },
};


//add-category - GET
const getAddCategory = {
    addCategory(req, res) {
        //new category added success message
        let {categoryAdded, successMessageDisplayed} = req.session;
        let messageDisplayed = successMessageDisplayed;
            if(categoryAdded && !messageDisplayed) {                      
                successMessageDisplayed = true;       //create session for displaying sccss msg
            }else{
                successMessageDisplayed = false;
                messageDisplayed = false;
            }
        
        const {invalidCategoryName, invalidCategory, categoryExist} = req.session;
        res.render("add_category",{ invalidCategoryName, invalidCategory, categoryExistError: categoryExist,
                                        categoryAddedSuccess: categoryAdded, messageDisplayed}, (error,data) =>{ 
            if(error){
                console.error('Error rendering add_category template:', error);
                return res.status(500).send("Internal server error");
            }
            successMessageDisplayed = false;
            delete req.session.categoryAdded;
            delete req.session.categoryExist;
            delete req.session.invalidCategoryName;
            delete req.session.invalidCategory;
            res.send(data);
        });
    },
};


//edit-category - GET
const getEditCategory = {
    async updateCategory(req, res) {

        // category updated success message
        let {categoryUpdated, successMessageDisplayed} = req.session;
        let messageDisplayed = successMessageDisplayed;
            if(categoryUpdated && !messageDisplayed) {                       
                successMessageDisplayed = true;       //create session for displaying sccss msg
            }else{
                successMessageDisplayed = false;
                messageDisplayed = false;
            }


        const {id} = req.params;
        const categoryDetails = await categoryDB.findOne({_id: id});
            if(categoryDetails) {
                console.log('categoryDetails: ', categoryDetails);
            }else{
                console.log('Category not found');
            }
        
        const { invalidCategoryName, invalidCategory, categoryExist } = req.session;
        res.render("edit_category",{ invalidCategoryName, invalidCategory, categoryDetails, categoryExistError : categoryExist, 
                                     categoryUpdatedSuccess: categoryUpdated, messageDisplayed}, (error,data) =>{ 
            if(error) {
                console.error('Error rendering edit_category template:', error);
                return res.status(500).send("Internal server error");
            }
            successMessageDisplayed = false;
            delete req.session.categoryUpdated;
            delete req.session.categoryExist;
            delete req.session.invalidCategoryName;
            delete req.session.invalidCategory;

            res.send(data);
        });
    },
};

// order-management - GET
const getOrderManagement = {
    async orderManagement(req, res) {

        const OrderData = await Orderdb.find().sort({createdAt: -1});
        console.log("Order Data: ",OrderData);
        const emails = OrderData.map(order => order.email);
        console.log("emails : ", emails);

        const result = await userdbCollection.find({ email: { $in: emails } });
            if(result.length > 0) {
                console.log('found');
                result.forEach(user => {
                    console.log('User data', user.name, user.email, user.phno);
                    req.session.userName = user.name
                });
            }else{
                console.log('User not found');
            }
    
        res.render('order_management',{ OrderData}, (err,html) =>{
            if(err){
                console.log(err);
                return res.send('Render error', err);
            }
            res.send(html);
        });         
    },
};


//adminCouponManagement - GET   
const getCouponManagement = {
    async couponManage (req, res) {
        try{
            const allCouponDetails = await couponDB.find({unlisted:false}).sort({createdAt : -1}); 

            // coupon updated success message
            let {couponUpdated, successMessageDisplayed} =req.session;
            let messageDisplayed = successMessageDisplayed;
                if(couponUpdated && !messageDisplayed) {                       
                    successMessageDisplayed = true;       
                }else{
                    successMessageDisplayed = false;
                    messageDisplayed = false;
                }
            

            const {couponDeleted} = req.session; 
            res.render("coupon_management", { couponDeletedSuccess : couponDeleted, couponUpdatedSuccess : couponUpdated, messageDisplayed, allCouponDetails}, (error,data) =>{ 
                if(error) {
                    console.error('Error rendering coupon_management template:', error);
                    return res.status(500).send("Internal server error");
                }

                successMessageDisplayed = false;
                delete req.session.couponUpdated;
                delete req.session.couponDeleted;


                res.send(data);
            });
        }catch(error) {
            console.error('Error fetching coupon details from MongoDB:', error);
            res.status(500).send('Internal Server Error');
        }
    },
};


// coupon-management - GET
const getAddCoupon = {
    async createCoupon(req, res) {
        // coupon added success message
        let {couponAdded, successMessageDisplayed} =req.session;
        let messageDisplayed = successMessageDisplayed;
            if(couponAdded && !messageDisplayed) {                       
                successMessageDisplayed = true;       
            }else{
                successMessageDisplayed = false;
                messageDisplayed = false;
            }
        
        const {couponCodeAlreadyExist} = req.session;
        res.render( 'add_coupon', { couponCodeAlreadyExist, couponAddedSuccess : couponAdded, messageDisplayed},(err, data)=>{
            if(err) {
                console.error('Error rendering add_coupon template:', err);
                return res.status(500).send("Internal server error");
            }
            successMessageDisplayed = false;
            delete req.session.couponAdded;
            delete req.session.couponCodeAlreadyExist;

            res.send(data);
        })
 
    },
};

// update-coupon - GET
const getUpdateCoupon = {
    async editCoupon(req, res) {
        // coupon added success message
        let {couponAdded, successMessageDisplayed} =req.session;
        let messageDisplayed = successMessageDisplayed;
            if(couponAdded && !messageDisplayed) {                       
                successMessageDisplayed = true;       
            }else{
                successMessageDisplayed = false;
                messageDisplayed = false;
            }

        const {id} = req.params;
        const allCouponDetails = await couponDB.findOne({_id: id});
            if(allCouponDetails) {
                console.log('allCouponDetails: ', allCouponDetails);
            }else{
                console.log('coupon data not found');
            }

        res.render('update_coupon',{ allCouponDetails,couponAddedSuccess : couponAdded, messageDisplayed},(err, data)=>{
            if(err) {
                console.error('Error rendering update_coupon template:', err);
                return res.status(500).send("Internal server error");
            }
            successMessageDisplayed = false;
            delete req.session.couponAdded;
            delete req.session.couponCodeAlreadyExist;

            res.send(data);
        })
    },
};


//Unlisted coupons - GET   
const getUnlistedCoupon = {
    async couponManage (req, res) {
        try {
            const allCouponDetails = await couponDB.find({unlisted:true}).sort({createdAt : -1}); 
           
            // coupon recovered success message
            let {couponRecovered, successMessageDisplayed} =req.session;
            let messageDisplayed = successMessageDisplayed;
                if(couponRecovered && !messageDisplayed) {                       
                    successMessageDisplayed = true;       
                }else{
                    successMessageDisplayed = false;
                    messageDisplayed = false;
                }

            res.render("unlisted_coupon", { couponRecoveredSuccess : couponRecovered, messageDisplayed, allCouponDetails}, (error,data) =>{ 
                if(error) {
                    console.error('Error rendering unlisted_coupon template:', error);
                    return res.status(500).send("Internal server error");
                }
                successMessageDisplayed = false;
                delete req.session.couponRecovered;

                res.send(data);
            });
        }catch(error) {
            console.error('Error fetching unlisted coupon details from MongoDB:', error);
            res.status(500).send('Internal Server Error');
        }
    },
};


//adminOfferManagement - GET   
const getOfferManagement = {
    async manageOffer (req, res) {
        try {
            const allProductOfferdata = await ProductOfferDB.find({unlisted:false}).sort({createdAt:-1});
            const allCategoryOffDetails =  await categoryOfferDB.find({unlisted:false}).sort({createdAt:-1});

            // product-offer updated success message  
            let {productOfferUpdated, successMessageDisplayed} =req.session;
            let messageDisplayed = successMessageDisplayed;
                if(productOfferUpdated && !messageDisplayed) {                       
                    successMessageDisplayed = true;       
                }else{
                    successMessageDisplayed = false;
                    messageDisplayed = false;
                }

            // product-offer deleted success message  
            let {productOfferDeleted, successMsgDisplayed} =req.session;
            let msgDisplayed = successMsgDisplayed;
                if(productOfferDeleted && !msgDisplayed){                       
                    successMsgDisplayed = true;      
                }else{
                    successMsgDisplayed = false;
                    msgDisplayed = false;
                }

            // category-offer deleted success message  
            let {categoryOfferDeleted, succsMsgDisplayed} =req.session;
            let mssgDisplayed = succsMsgDisplayed;
                if(categoryOfferDeleted && !mssgDisplayed) {                       
                    succsMsgDisplayed = true;       
                }else{
                    succsMsgDisplayed = false;
                    mssgDisplayed = false;
                }

            // category offer updated success message 
            let {categoryOfferUpdated, successpopupDisplayed} =req.session;
            let popupDisplayed = successpopupDisplayed;
                if(categoryOfferUpdated && !popupDisplayed) {                       
                    successpopupDisplayed = true;       
                }else{
                    successpopupDisplayed = false;
                    popupDisplayed = false;
                }

            res.render("offer_management", { categoryOfferUpdated, popupDisplayed, categoryOfferDeleted, mssgDisplayed,
                            allCategoryOffDetails, allProductOfferdata,productOfferUpdated,messageDisplayed,
                            productOfferDeleted,msgDisplayed }, (error,data) =>{ 
                if(error){
                    console.error('Error rendering offer_management template:', error);
                    return res.status(500).send("Internal server error");
                }

                successMessageDisplayed = false;
                delete req.session.productOfferUpdated;
                successMsgDisplayed = false
                delete req.session.productOfferDeleted;
                succsMsgDisplayed = false;
                delete req.session.categoryOfferDeleted
                successpopupDisplayed = false;
                delete req.session.categoryOfferUpdated;

                res.send(data);
            });
        }catch(error) {
            console.error('Error fetching offer details from MongoDB:', error);
            res.status(500).send('Internal Server Error');
        }
    },
};


//adminOfferManagement - GET   
const getUnlistedOffers = {
    async unlistedOffers (req, res) {
        try {
            const allProductOfferdata = await ProductOfferDB.find({unlisted:true}).sort({createdAt:-1});
            const allCategoryOffDetails =  await categoryOfferDB.find({unlisted:true}).sort({createdAt:-1});

            // category-offer recover success message  
            let {categoryOfferRecovered, successMessageDisplayed} =req.session;
            let messageDisplayed = successMessageDisplayed;
                if(categoryOfferRecovered && !messageDisplayed) {                       
                    successMessageDisplayed = true;       
                }else{
                    successMessageDisplayed = false;
                    messageDisplayed = false;
                }

            // product-offer recover success message  
            let {productOfferRecovered, successMsgDisplayed} =req.session;
            let msgDisplayed = successMsgDisplayed;
                if(productOfferRecovered && !msgDisplayed) {                       
                    successMsgDisplayed = true;       
                }else{
                    successMsgDisplayed = false;
                    msgDisplayed = false;
                }

                res.render("unlisted_offers", { categoryOfferRecovered, messageDisplayed, allCategoryOffDetails, 
                                    allProductOfferdata, productOfferRecovered, msgDisplayed }, (error,data) =>{ 
                if(error) {
                    console.error('Error rendering unlisted_offers template:', error);
                    return res.status(500).send("Internal server error");
                }
                successMessageDisplayed = false;
                delete req.session.categoryOfferRecovered;
                successMsgDisplayed = false
                delete req.session.productOfferRecovered;

                res.send(data);
            });
        }catch(error) {
            console.error('Error fetching offer details from MongoDB:', error);
            res.status(500).send('Internal Server Error');
        }
    },
};


// add product-offer - GET
const getAddProductOffer = {
    async createProductOffer(req, res) {
        // produnc-offer added success message
        let {productOfferAdded, successMessageDisplayed} =req.session;
        let messageDisplayed = successMessageDisplayed;
            if(productOfferAdded && !messageDisplayed) {                       
                successMessageDisplayed = true;       
            }else{
                successMessageDisplayed = false;
                messageDisplayed = false;
            }

        // product not exist success message
        let {productNotExist, successMsgDisplayed} =req.session;
        let msgDisplayed = successMsgDisplayed;
            if(productNotExist && !msgDisplayed) {                       
                successMsgDisplayed = true;       
            }else{
                successMsgDisplayed = false;
                msgDisplayed = false;
            }
        
        const {offerAlreadyExistOnProduct} = req.session;
        res.render('add_productOffer',{ productNotExist, msgDisplayed, offerAlreadyExistOnProduct, productOfferAddedSuccess:productOfferAdded,
                        messageDisplayed },(err, data)=>{
            if(err) {
                console.error('Error rendering add_productOffer template:', err);
                return res.status(500).send("Internal server error");
            }
            successMessageDisplayed = false;
            delete req.session.productOfferAdded;
            successMsgDisplayed = false;
            delete req.session.productNotExist;
            delete req.session.offerAlreadyExistOnProduct;

            res.send(data);
        })
    },
};

// update-ProductOffer - GET
const getUpdateProductOffer = {
    async editProductOffer(req, res) {
        const {id} = req.params;
        const allProductOfferDetails = await ProductOfferDB.findOne({_id: id});
            if(allProductOfferDetails) {
                console.log('allProductOfferDetails: ', allProductOfferDetails);
            }else{
                console.log('product offer data not found');
            }
        
        res.render('update_productOffer',{ allProductOfferDetails},(err, data)=>{
            if(err) {
                console.error('Error rendering update_productOffer template:', err);
                return res.status(500).send("Internal server error");
            }
            res.send(data);
        })
    },
};


// add-category-offer - GET
const getAddCategoryOffer = {
    async createProductOffer(req, res) {
        const allCategories = await categoryDB.find();

        // category offer added success message 
        let {categoryOfferAdded, successMessageDisplayed} =req.session;
        let messageDisplayed = successMessageDisplayed;
            if(categoryOfferAdded && !messageDisplayed) {                       
                successMessageDisplayed = true;       
            }else{
                successMessageDisplayed = false;
                messageDisplayed = false;
            }

        // category-offer deleted success message 
        let {categoryOfferDeleted, successMsgDisplayed} =req.session;
        let msgDisplayed = successMsgDisplayed;
            if(categoryOfferDeleted && !msgDisplayed) {                       
                successMsgDisplayed = true;       
            }else{
                successMsgDisplayed = false;
                msgDisplayed = false;
            }
            
        const {alreadyOfferExistOnCategory} = req.session;
        res.render('add_categoryOffer',{ alreadyOfferExistOnCategory, allCategories, categoryOfferAdded, messageDisplayed},(err, data)=>{
            if(err) {
                console.error('Error rendering add_categoryOffer template:', err);
                return res.status(500).send("Internal server error");
            }
            successMessageDisplayed = false;
            delete req.session.categoryOfferAdded;
            delete req.session.alreadyOfferExistOnCategory;

            res.send(data);
        })
    },
};


// update-ProductOffer - GET
const getUpdateCategoryOffer = {
    async editCategoryOffer(req, res) {
        const {id} = req.params;
        const allCategories = await categoryDB.find();   //used in dropdown
        const singleCategoryOfferDetails = await categoryOfferDB.findOne({_id: id});
            if(singleCategoryOfferDetails) {
                console.log('CategoryOfferDetails: ', singleCategoryOfferDetails);
            }else{
                console.log('category offer data not found');
            }
     
        const {negativeCouponDiscount} = req.session;
        res.render('update_categoryOffer',{negativeCouponDiscount, allCategories, singleCategoryOfferDetails},(err, data)=>{
            if(err) {
                console.error('Error rendering update_categoryOffer template:', err);
                return res.status(500).send("Internal server error");
            }
            delete req.session.negativeCouponDiscount

            res.send(data);
        })
    },
};


// get referral-offer - GET
const getReferralOffer = {
    async referralOffer(req, res) {
        const referralDetails = await referralOfferDB.findOne();
        console.log(referralDetails);

        let formattedDate = null;
        if(referralDetails){
            const expDate = new Date(referralDetails.expDate);

            const day = String(expDate.getDate()).padStart(2, '0');
            const month = String(expDate.getMonth() + 1).padStart(2, '0'); 
            const year = expDate.getFullYear().toString(); 
            formattedDate = `${year}-${month}-${day}`;
            console.log(formattedDate); 
        }
        
        const { referralOfferUpdated, referralOfferDeleted } = req.session;  
        res.render('referralOffer_Management',{ referralOfferDeleted, referralOfferUpdated,referralDetails, formattedDate },(err, data)=>{
            if(err) {
                console.error('Error rendering referralOffer_Management template:', err);
                return res.status(500).send("Internal server error");
            }
            req.session.referralOfferUpdated = null;
            req.session.referralOfferDeleted = null;

            res.send(data);
        })
    },
};


// add-referralOffer - GET
const getAddReferralOffer = {
    async createReferralOffer(req, res) {
        const { referralOfferAdded, invalidReferralAmount, negativeReferralAmount, invalidUserReward, negativeUserReward } = req.session;

        res.render('add_referralOffer',{ referralOfferAdded, invalidReferralAmount, negativeReferralAmount,
                    invalidUserReward, negativeUserReward },(err, data)=>{
            if(err) {
                console.error('Error rendering add_referralOffer template:', err);
                return res.status(500).send("Internal server error");
            }
            delete req.session.referralOfferAdded;
            delete req.session.invalidReferralAmount;
            delete req.session.negativeReferralAmount;
            delete req.session.invalidUserReward;
            delete req.session.negativeUserReward;

            res.send(data);
        })
    },
};

// add-referralOffer - GET
const getUpdateReferralOffer = {
    async editReferralOffer(req, res) {
        
        const referralDetails = await referralOfferDB.findOne();
        console.log(referralDetails);

        const expDate = new Date(referralDetails.expDate);
        //extract day,month& year
        const day = String(expDate.getDate()).padStart(2, '0');
        const month = String(expDate.getMonth() + 1).padStart(2, '0'); 
        const year = expDate.getFullYear().toString(); 
        const formattedDate = `${year}-${month}-${day}`;

        const {invalidReferralAmount, negativeReferralAmount, invalidUserReward, negativeUserReward } = req.session;
        res.render('update_referralOffer',{invalidReferralAmount, negativeReferralAmount, invalidUserReward,
                         negativeUserReward, referralDetails, formattedDate },(err, data)=>{
            if(err) {
                console.error('Error rendering update_referralOffer template:', err);
                return res.status(500).send("Internal server error");
            }
            delete req.session.invalidReferralAmount;
            delete req.session.negativeReferralAmount
            delete req.session.invalidUserReward, 
            delete req.session.negativeUserReward
            res.send(data);
        })
    },
};


/************* end of Admin side ****************/

module.exports = {getAdminLogin, getAdminHome, getuserManagement, getUserSearchResult, getAdminAddProduct, getProductManagement,
                    getAdminUnlistedProduct,getUpdateProduct, getCategoryManagement, getUnlistedCategory, getAddCategory,
                    getEditCategory, getOrderManagement, getCouponManagement, getAddCoupon, getUpdateCoupon, getOfferManagement,
                    getAddProductOffer, getUpdateProductOffer, getAddCategoryOffer, getUpdateCategoryOffer, getReferralOffer, 
                    getAddReferralOffer, getUpdateReferralOffer, getUnlistedCoupon, getUnlistedOffers}

