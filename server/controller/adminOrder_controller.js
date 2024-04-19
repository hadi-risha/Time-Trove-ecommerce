const Orderdb = require("../model/orderModel")
const couponDB = require("../model/couponModel")
const ProductOfferDB = require("../model/offer-ProductModel")
const categoryOfferDB = require("../model/offer-CategoryModel");
const productDB = require("../model/productModel");
const walletDB = require("../model/walletModel")


///admin-productStatus - POST
const changeStatus = {
    async orderProductstatus(req, res) {
        const {orderId, productId, orderStatus} = req.body;    
        console.log('orderId--',orderId);
        console.log('productId--',productId);
        console.log('orderStatus--',orderStatus);

        // if status change to cancell increase qty in productdb
        if(orderStatus === "cancelled"){
            let userAddedQty = 0;    

            //find product to increase qty in productdb
            const orderData = await Orderdb.findOne({ _id: orderId})
            const result = await Orderdb.findOne({ _id: orderId, 'orderItems._id': productId }, { 'orderItems.$': 1 }).exec();
            console.log(" single cancelled product details in orderdb ", result);

            const foundProduct = result.orderItems[0];
            console.log("Product ID:", foundProduct.productId);
            console.log("remove/cancel qty", foundProduct.userAddedQty);
            userAddedQty = foundProduct.userAddedQty;
            
            //increase quantity (in productDB) based on userAddedQuantity
            const updateResult = await productDB.updateOne({ _id: foundProduct.productId }, { $inc: { quantity: userAddedQty } }, {new: true});
            if(updateResult.modifiedCount ===0) {
                console.log('Qty not incremented : ', updateResult);
            }else{
                console.log('Qty incremented successfully : ', updateResult);
            }

            //cancelled product details in - foundProduct
            console.log("is this in order db data ", foundProduct.productId );       
            const cancelledDetails = await productDB.findOne({ _id: foundProduct.productId })
            console.log("this is from productdb", cancelledDetails);

            const productDiscount = cancelledDetails.productofferDiscount;
            const categoryDiscount = cancelledDetails.categoryofferDiscount;
            const firstPrice = cancelledDetails.firstPrice;
            const discount = cancelledDetails.discount;
            const discountInNo = (firstPrice * discount)/100;
            const lastPrice = firstPrice - discountInNo

            let price = 0;
            if(productDiscount && categoryDiscount){
                const finalizeDiscount = productDiscount > categoryDiscount ? productDiscount : categoryDiscount;
                const discnt = finalizeDiscount + discount;
                const discountInNums = (firstPrice * discnt)/100;
                price = firstPrice - discountInNums;
            }else if(productDiscount){
                const discnt = productDiscount + discount
                const discountInNums = (firstPrice * discnt)/100;
                price = firstPrice - discountInNums;
            }else if(categoryDiscount){
                const discnt = categoryDiscount + discount
                const discountInNums = (firstPrice * discnt)/100;
                price = firstPrice - discountInNums;
            }else{
                price = lastPrice ;
                console.log('4', price);
            }

            const productFinalPrice = price * foundProduct.userAddedQty;
            console.log('price of a cancelled single product after apply all offers or without any offers',productFinalPrice);
            console.log('price of a single product after apply all offers or without any offers',price * foundProduct.userAddedQty);
            const orderAmount = orderData.finalAmount;
            console.log('price of all products',orderAmount);
            const newFinalAmount = orderAmount - (price * foundProduct.userAddedQty)
            console.log('the price should show in orderdb after cancel the single product', newFinalAmount);

            const getEmail = await Orderdb.findOne({ _id: orderId});
            console.log('getEmail of the ordered user-------------',getEmail.email);
            let userEmail = getEmail.email;

            if(orderData.paymentstatus === 'completed'){
                const updatePrice = await Orderdb.findOneAndUpdate({_id: orderId}, {$set:{finalAmount : newFinalAmount}}, {new : true});
                //handle wallet
                const wallet = await walletDB.findOneAndUpdate({email: userEmail}, {$inc:{balance: price * foundProduct.userAddedQty},
                    $push: { transactions: {
                        amount: price,
                        action: "credit"
                        },},
                    },{ new: true, upsert: true });
            }

            let ttlPricebeforeCancellation = orderData.finalAmount + orderData.balanceToPay;
            let ttlPriceAfterCancellation = ttlPricebeforeCancellation - productFinalPrice;
            if(orderData.paymentstatus === 'pending' && orderData.paymentMethod === "wallet" && orderData.balanceToPay > 0){

                if(productFinalPrice === orderData.balanceToPay){
                    const updateOrders = await Orderdb.findOneAndUpdate({_id: orderId}, {$set:{balanceToPay : 0, paymentstatus: "completed"}}, {new : true});
                    if(updateOrders.modifiedCount === 0){
                        console.log("while cancel order(admin side),payment status and balancetopay not updated(walletWithRazorpay)");
                    }else{
                        console.log("while cancel order(admin side), payment status and balancetopay updated(walletWithRazorpay)");
                    }
                }else if(ttlPriceAfterCancellation > orderData.finalAmount){
                    let remainingBalance = ttlPriceAfterCancellation - orderData.finalAmount;
                    const updateOrders = await Orderdb.findOneAndUpdate({_id: orderId}, {$set:{balanceToPay : remainingBalance}}, {new : true});
                    if(updateOrders.modifiedCount === 0){
                        console.log("while cancel order(admin side),balancetopay not updated(walletWithRazorpay)");
                    }else{
                        console.log("while cancel order(admin side),balancetopay updated(walletWithRazorpay)");
                    }
                }else if(orderData.balanceToPay > productFinalPrice){
                    let newPrice = ttlPricebeforeCancellation - productFinalPrice
                    const updateBalance = orderData.balanceToPay - productFinalPrice;
                    const updateOrders = await Orderdb.findOneAndUpdate({_id: orderId}, {$set:{finalAmount: newPrice ,balanceToPay : updateBalance}}, {new : true});
                    if(updateOrders.modifiedCount === 0){
                        console.log("while cancel order(admin side),balancetopay not updated(walletWithRazorpay)");
                    }else{
                        console.log("while cancel order(admin side),balancetopay updated(walletWithRazorpay)");
                    }
                }else if(orderData.finalAmount > ttlPriceAfterCancellation){
                    let walletMoney = orderData.finalAmount - ttlPriceAfterCancellation;
        
                    const wallet = await walletDB.findOneAndUpdate({email: userEmail}, {$inc:{balance: walletMoney},
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
                    const updateOrders = await Orderdb.findOneAndUpdate({_id: orderId}, {$set:{finalAmount: newPrice ,balanceToPay:0, paymentstatus:"completed"}}, {new: true});
                    if(updateOrders.modifiedCount === 0){
                        console.log("while cancel order(admin side),payment status and balancetopay not updated(walletWithRazorpay)");
                    }else{
                        console.log("while cancel order(admin side), payment status and balancetopay updated(walletWithRazorpay)");
                    }
                }
            }      
        }
        // /if status change to cancell increase qty in productdb


        //handle status
        const result = await Orderdb.updateOne({ _id: orderId, 'orderItems._id': productId },{ $set: { 'orderItems.$.orderStatus': orderStatus } }, { new: true })
            if(result){
                console.log("status updated successfully : ", result);
            }
        // /handle status
        res.redirect("/order-management");
    },
};


//admin-addCoupon - POST
const addCoupon = {
    async createCoupon(req, res) {
        try{
        const {couponCode, discount, useAbove, maxUses, expDate} = req.body;
        const trimmedCouponCode = couponCode.trim();

        //Checking if the coupon code already exists
        const data = await couponDB.find({ couponCode: trimmedCouponCode });
        if(data.length > 0){
            // A coupo already exists
            console.log('coupon already exist,choose another coupon code', data);
            req.session.couponCodeAlreadyExist = true;    
            res.redirect('/add-coupon');
            return;
        }

        //validate trimmedCouponCode
        if (trimmedCouponCode.length < 2) {
            req.session.invalidCpnCode = true;
            console.log('product name should contain at least 2 letters');
            res.redirect('/add-coupon');
            return;
        }

        //validate discount
        if (!/^(?:\d*\.)?\d+$/.test(discount)) {
            console.log('Please provide non-negative values for discount.');
            req.session.negativeCouponDiscount= true;
            res.redirect('/add-coupon');
            return;
        }

        //check if discount is within the valid percentage range (1-99)
        if (discount < 1 || discount > 99) {
            console.log('Discount percentage should be between 1 and 99.');
            req.session.notValidCouponDiscount = true;
            res.redirect('/add-coupon');
            return;
        }

        //validation for discount exceeding 100
        if (discount > 100) {
            console.log('Discount percentage cannot exceed 100.');
            req.session.invalidCouponPercentage = true;
            res.redirect('/add-coupon');
            return;
        }

        //validate discount
        if (!/\d{1,}/.test(discount)) {
            req.session.invalidCouponDiscount = true;
            console.log('discount should contain at least 1 number');
            res.redirect('/add-coupon');
            return;
        }

        //validate trimmedUseAbove
        if (!/^(?:\d*\.)?\d+$/.test(useAbove)) {
            console.log('Please provide non-negative values for trimmedPUseAbove.');
            req.session.negativeUseAboveNum = true;
            res.redirect('/add-coupon');
            return;
        }

        //validate trimmedUseAbove
        if (!/\d{1,}/.test(useAbove)) {
            req.session.invalidUseAboveNum = true;
            console.log('trimmedPUseAbove price should contain at least 1 numbers');
            res.redirect('/add-coupon');
            return;
        }

        if (!/\d{1,}/.test(maxUses)) {
            req.session.invalidMaxUseNum = true;
            console.log('trimmedMaxUse should contain at least 1 number');
            res.redirect('/add-coupon');
            return;
        }


        //create new product details
        let newCoupon = new couponDB({
            couponCode: trimmedCouponCode.toUpperCase(),
            discount: discount,
            maxUses: maxUses,
            useAbove: useAbove,
            expDate:expDate })

        const result = await newCoupon.save();
            if(result){
            req.session.couponAdded = true
            res.redirect('/add-coupon');
            }

        }catch(err){
            console.log(err);
        }
    },
};


//admin-updateCoupon - POST
const updateCoupon = {
    async editCoupon(req, res) {
        try{
        const { id, couponCode, discount, useAbove, maxUses, expDate} = req.body;
        console.log('coupon before updation',couponCode, discount, useAbove, maxUses, expDate);

        const currentCoupon = await couponDB.findOne({ _id: id });

        const trimmedCouponCode = couponCode.trim();

        // validate trimmedCouponCode
        if (trimmedCouponCode.length < 2) {
            req.session.invalidCpnCode = true;
            console.log('product name should contain at least 2 letters');
            res.json({success: false, url: `/update-coupon/${id}`})
            return;
        }

        const discountString = discount.toString();
        if(discountString.trim() <= 0){
            console.log('no values found in discount');
            res.json({success: false, url: `/update-coupon/${id}`})
            return;
        }

        //validate discount
        if (!/^(?:\d*\.)?\d+$/.test(discount)) {
            console.log('Please provide non-negative values for discount.');
            req.session.negativeCouponDiscount= true;
            res.json({success: false, url: `/update-coupon/${id}`})
            return;
        }

        //check if discount is within the valid percentage range (1-99)
        if (discount < 1 || discount > 99) {
            console.log('Discount percentage should be between 1 and 99.');
            req.session.notValidCouponDiscount = true;
            res.json({success: false, url: `/update-coupon/${id}`})
            return;
        }

        //validation for discount exceeding 100
        if (discount > 100) {
            console.log('Discount percentage cannot exceed 100.');
            req.session.invalidCouponPercentage = true;
            res.json({success: false, url: `/update-coupon/${id}`})
            return;
        }

        //validate discount
        if (!/\d{1,}/.test(discount)) {
            req.session.invalidCouponDiscount = true;
            console.log('discount should contain at least 1 number');
            res.json({success: false, url: `/update-coupon/${id}`})
            return;
        }

        //validate trimmedUseAbove
        const maxUsesString = useAbove.toString();
        if(maxUses.trim() <= 0){
            console.log('no values found in maxUses field');
            res.json({success: false, url: `/update-coupon/${id}`})
            return;
        }

        if (!/^(?:\d*\.)?\d+$/.test(useAbove)) {
            console.log('Please provide non-negative values for trimmedPUseAbove.');
            req.session.negativeUseAboveNum = true;
            res.json({success: false, url: `/update-coupon/${id}`})
            return;
        }

        //validate trimmedUseAbove
        if (!/\d{1,}/.test(useAbove)) {
            req.session.invalidUseAboveNum = true;
            console.log('trimmedPUseAbove price should contain at least 1 numbers');
            res.json({success: false, url: `/update-coupon/${id}`})
            return;
        }

        const useAboveString = useAbove.toString();
        if(useAboveString.trim() <= 0){
            console.log('no values found in UseAvove field');
            res.json({success: false, url: `/update-coupon/${id}`})
            return;
        }

        if (!/\d{1,}/.test(maxUses)) {
            req.session.invalidMaxUseNum = true;
            console.log('trimmedMaxUse should contain at least 1 number');
            res.json({success: false, url: `/update-coupon/${id}`})
            return;
        }

        const newData = {
            couponCode: trimmedCouponCode.toUpperCase(),
            discount: discount,
            maxUses: maxUses,
            useAbove: useAbove,
            expDate:expDate
            }
        
        const updatedCoupon = await couponDB.updateOne({ _id: id }, { $set: newData }, { new: true, useFindAndModify: false });
        if(updatedCoupon.modifiedCount === 0) {
            console.log("coupon not found or not updated");
            res.status(200).json({ success: false, message: "coupon not found or not updated" });
        }else{
            console.log('new coupon details after updation', updatedCoupon);
            console.log("coupon Updated successfully");
            req.session.couponUpdated = true
            res.status(200).json({ success: true });
        }
        }catch(err){
            console.log(err);
        }
    },
};


//admin-deleteCoupon - POST
const deleteCoupon = {
    async removeCoupon(req, res) {
        try{
            const {id}=req.body;

            const result = await couponDB.updateOne({_id:id},{$set:{unlisted:true}});
            if (result.modifiedCount === 0) {
                console.log("coupon not deleted");
            }else{
                req.session.couponDeleted = true;
                console.log("coupon moved to unlisted");
                res.status(200).json({ success: true });
            }

            if(result.modifiedCount === 0){
                console.log("category not moved to unlisted");
                res.status(200).json({ success: false, message: "category not moved to unlisted" });
            }else{
                console.log("category moved to unlisted");
                req.session.categoryDeleted = true;
            }
        }catch(err){
            console.error('Error deleting coupon:', err);
            req.session.couponDeletionError = 'An error occurred while trying to delete the coupon.';
            res.redirect("/coupon-management");
        }
    },
};


//admin-recoverCoupon - POST
const recoverCoupon = {
    async manageCoupon(req, res) {
        try{
            const {id}=req.body;

            const result = await couponDB.updateOne({_id:id},{$set:{unlisted:false}});
            if (result.modifiedCount === 0) {
                console.log("coupon not recovered");
                res.status(200).json({ success: false, message: "coupon not recovered" });
            }else{
                req.session.couponRecovered = true;
                console.log("coupon recovered from unlisted");
                res.status(200).json({ success: true });
            }
        }catch(err){
            console.error('Error recovering coupon:', err);
            req.session.couponDeletionError = 'An error occurred while trying to recover the coupon.';
            res.redirect("/coupon-management");
        }
    },
};


//admin-productOff - POST
const addProductOffer = {
    async productDiscount(req, res) {
        try{
            const {product, discount, expDate} = req.body;
            console.log('data', product, discount, expDate);
            
            const trimmedProductName = product.trim();
            
            //checking if the product already has an offer
            const data = await ProductOfferDB.find({ product: trimmedProductName });
            if(data.length > 0){
                //a offer already exists
                console.log('The product already has an offer.', data);
                req.session.offerAlreadyExistOnProduct = true;    
                res.redirect('/add-ProductOffer');
                return;
            }
    
            if (trimmedProductName.length < 2) {
                req.session.invalidCpnCode = true;
                console.log('product name should contain at least 2 letters');
                res.redirect('/add-ProductOffer');
                return;
            }
    
            if (!/^(?:\d*\.)?\d+$/.test(discount)) {
                console.log('Please provide non-negative values for discount.');
                req.session.negativeCouponDiscount= true;
                res.redirect('/add-ProductOffer');
                return;
            }
            
            if (discount < 1 || discount > 99) {
                console.log('Discount percentage should be between 1 and 99.');
                req.session.notValidCouponDiscount = true;
                res.redirect('/add-ProductOffer');
                return;
            }
    
            if (discount > 100) {
                console.log('Discount percentage cannot exceed 100.');
                req.session.invalidCouponPercentage = true;
                res.redirect('/add-ProductOffer');
                return;
            }
    
            // validate discount
            if (!/\d{1,}/.test(discount)) {
                req.session.invalidCouponDiscount = true;
                console.log('discount should contain at least 1 number');
                res.redirect('/add-ProductOffer');
                return;
            }
            

            //check the product exist, if not throw an err
            const isproExist = await productDB.findOne({ productName: trimmedProductName })
            if(!isproExist){
                req.session.productNotExist = true;
                console.log('cannot apply offer to a non existing product');    
                res.redirect('/add-ProductOffer');
                return;
            }
            
            let newProductOff = new ProductOfferDB({
                    product: trimmedProductName,
                    discount: discount,
                    expDate:expDate })

            const result = await newProductOff.save();
            if(result){
                console.log('product name', result.product, 'pro disco',result.discount, "pro expdat", result.expDate );
                // first update productdb with product offer
                const productDataUpdate = await productDB.updateMany({productName : result.product},
                     {$set:{productofferDiscount :newProductOff.discount, productofferExpDate: newProductOff.expDate}})
                req.session.productOfferAdded = true;
                res.redirect('/add-ProductOffer');
            }
        }catch(err){
            console.log(err);
        }
    },
};


//update-productOff - POST
const updateProductOffer = {
    async productDiscount(req, res) {
        try{
            const {id, product, discount, expDate} = req.body;
            console.log('data before updation', product, discount, expDate);
            
            const trimmedProductName = product.trim();
    
            // Checking if the product already has an offer
            // const data = await ProductOfferDB.find({ product: trimmedProductName });
            // if(data.length > 0){
            //     //a offer already exists
            //     console.log('The product already has an offer.', data);
            //     req.session.offerAlreadyExistOnProduct = true;    
            //     res.redirect('/add-ProductOffer');
            //     return;
            // }
    
            if (trimmedProductName.length < 2) {
                req.session.invalidCpnCode = true;
                console.log('product name should contain at least 2 letters');
                res.json({success: false, url: `/update-productOffer/${id}`})
                return;
            }
    
            if (!/^(?:\d*\.)?\d+$/.test(discount)) {
                console.log('Please provide non-negative values for discount.');
                req.session.negativeCouponDiscount= true;
                res.json({success: false, url: `/update-productOffer/${id}`})
                return;
            }
            
            if (discount < 1 || discount > 99) {
                console.log('Discount percentage should be between 1 and 99.');
                req.session.notValidCouponDiscount = true;
                res.json({success: false, url: `/update-productOffer/${id}`})
                return;
            }

            if (discount > 100) {
                console.log('Discount percentage cannot exceed 100.');
                req.session.invalidCouponPercentage = true;
                res.json({success: false, url: `/update-productOffer/${id}`})
                return;
            }
    
            if (!/\d{1,}/.test(discount)) {
                req.session.invalidCouponDiscount = true;
                console.log('discount should contain at least 1 number');
                res.json({success: false, url: `/update-productOffer/${id}`})
                return;
            }

            const newData = {product : trimmedProductName,
                                discount: discount,
                                expDate: expDate
                            }
            console.log('proname',trimmedProductName);
            const updatedProductOffer = await ProductOfferDB.updateOne({ _id: id }, { $set: newData }, { new: true, useFindAndModify: false });

            console.log('product name', newData.product, 'pro disco',newData.discount, "pro expdat", newData.expDate );
            //and also update productdb with product offer
            const productDataUpdate = await productDB.updateMany({productName : newData.product },
                    {$set:{productofferDiscount :newData.discount, productofferExpDate: newData.expDate}})
            if(updatedProductOffer.modifiedCount === 0) {
                console.log("product-offerr not found or not updated");
                res.status(200).json({ success: false, message: "product-offerr not found or not updated" });
            }else{
                console.log('product-offer details after updation', updatedProductOffer);
                console.log("product offer Updated successfully");
                req.session.productOfferUpdated = true;
                res.status(200).json({ success: true });
            }
        }catch(err){
            console.log(err);
        }
    },
};


//admin-deleteProductOffer - POST
const deleteProductOffer = {
    async removeproductOff(req, res) {
        try{
            const {id}=req.body;
            console.log(id);
            const offData = await ProductOfferDB.findOne({_id:id});
            //update productDb details according to productoffer state
            console.log('product name', offData.product, 'pro disco',offData.discount, "pro expdat", offData.expDate );

            //when delete product offer , update productDb with unset the offer field values
            const productDataUpdate = await productDB.updateMany({productName : offData.product},
                {$unset:{productofferDiscount :"", productofferExpDate: ""}}, {new:true})
                if(productDataUpdate.modifiedCount === 0){
                    console.log('productOff not removed in productDB');
                }

            const result = await ProductOfferDB.updateOne({_id:id}, {$set:{unlisted:true}});
            if(result.modifiedCount === 0) {
                console.log('No offer(product-offer) found with the provided ID');
                req.session.couponDeletionError = 'No product-offer found with the provided id';
                // res.redirect("/offer-management");
            }else{
                console.log('ProductOffer moved to unlisted');
                req.session.productOfferDeleted = true;
                res.status(200).json({ success: false, message: "ProductOffer moved to unlisted" });
            }   
        }catch(err){
            console.error('Error deleting coupon:', err);
            req.session.couponDeletionError = 'An error occurred while trying to delete the product offer.';
            res.redirect("/offer-management");
        }
    },
};

//admin-recoverProductOffer - POST
const recoverProductOffer = {
    async recoverproductOff(req, res) {
        try{
            const {id}=req.body;
            console.log(id);
            const offData = await ProductOfferDB.findOne({_id:id});

            // update productDb details according to productoffer state
            console.log('product name', offData.product, 'pro disco',offData.discount, "pro expdat", offData.expDate );
            const productDataUpdate = await productDB.updateMany({productName : offData.product},
                {$set:{productofferDiscount :offData.discount, productofferExpDate: offData.expDate}}, {new:true})
            if(productDataUpdate.modifiedCount === 0){
                console.log('productOff not Added in productDb');
            }else{
                console.log('product offer added in productDb');
            }

            const result = await ProductOfferDB.updateOne({_id:id}, {$set:{unlisted:false}});
            if(result.modifiedCount === 0) {
                console.log('No offer(product-offer) found with the provided ID');
                req.session.couponDeletionError = 'No product-offer found with the provided id';
                
                res.status(200).json({ success: false, message: "No product-offer found with the provided id" });
            }else{
                console.log('Product offer recovered');
                req.session.productOfferRecovered = true;
                res.status(200).json({ success: true });
            }
        }catch(err){
            console.error('Error deleting coupon:', err);
            req.session.couponDeletionError = 'An error occurred while trying to recover the product offer.';
            res.redirect("/offer-management");
        }
    },
};


//admin-addCategoryOff - POST
const addCategoryOffer = {
    async categoryOffer(req, res) {
        try{
            const {category, discount, expDate} = req.body;
            console.log( category, discount, expDate);
            
            if (category === '') {
                req.session.invalidCategoryinOffer = true;
                console.log('category should contain at least 2 letters, (field required');
                res.redirect('/add-categoryOffer');
                return;
            }
            const trimmedCategory = category.trim();
    
            // Checking if the product already has an offer
            const data = await categoryOfferDB.find({ category: trimmedCategory });
            if(data.length > 0){
                //a category-offer already exists
                console.log('The category already has an offer.', data);
                req.session.alreadyOfferExistOnCategory = true;    
                res.redirect('/add-categoryOffer');
                return;
            }
    
            if (trimmedCategory === '') {
                req.session.invalidCategoryinOffer = true;
                console.log('category should contain at least 2 letters, (field required');
                res.redirect('/add-categoryOffer');
                return;
            }
    
            if (!/^(?:\d*\.)?\d+$/.test(discount)) {
                console.log('Please provide non-negative values for discount.');
                req.session.negativeCouponDiscount= true;
                res.redirect('/add-categoryOffer');
                return;
            }

            if (discount < 1 || discount > 99) {
                console.log('Discount percentage should be between 1 and 99.');
                req.session.notValidCouponDiscount = true;
                res.redirect('/add-categoryOffer');
                return;
            }
    
            if (discount > 100) {
                console.log('Discount percentage cannot exceed 100.');
                req.session.invalidCouponPercentage = true;
                res.redirect('/add-categoryOffer');
                return;
            }
    
            if (!/\d{1,}/.test(discount)) {
                req.session.invalidCouponDiscount = true;
                console.log('discount should contain at least 1 number');
                res.redirect('/add-categoryOffer');
                return;
            }
    
            //first update productdb with category offer
            const categoryDataUpdate = await productDB.updateMany({category : trimmedCategory},
                    {$set:{categoryofferDiscount : discount, categoryofferExpDate : expDate }})
            
            //create new category offer details
            let newCategoryOff = new categoryOfferDB({
                                    category: trimmedCategory,
                                    discount: discount,
                                    expDate:expDate })
                
            const result = await newCategoryOff.save();
            if(result){
            req.session.categoryOfferAdded = true
            res.redirect('/add-categoryOffer');
            }
        }catch(err){
            console.log(err);
        }
    },
};


//update-updateCategoryOffer - POST
const updateCategoryOffer = {
    async categoryUpdate(req, res) {
        try{
            const {id, category, discount, expDate} = req.body;
            console.log('data before updation', category, discount, expDate);
            
            const trimmedCategory = category.trim();
    
            if (trimmedCategory.length < 2) {
                req.session.invalidCpnCode = true;
                console.log('category name should contain at least 2 letters');
                res.json({success: false, url: `/update-categoryOffer/${id}`})
                return;
            }
    
            if (!/^(?:\d*\.)?\d+$/.test(discount)) {
                console.log('Please provide non-negative values for discount.');
                req.session.negativeCouponDiscount= true;
                res.json({success: false, url: `/update-categoryOffer/${id}`})
                return;
            }

            if (discount < 1 || discount > 99) {
                console.log('Discount percentage should be between 1 and 99.');
                req.session.notValidCouponDiscount = true;
                res.json({success: false, url: `/update-categoryOffer/${id}`})
                return;
            }
    
            if (discount > 100) {
                console.log('Discount percentage cannot exceed 100.');
                req.session.invalidCouponPercentage = true;
                res.json({success: false, url: `/update-categoryOffer/${id}`})
                return;
            }
    
            if (!/\d{1,}/.test(discount)) {
                req.session.invalidCouponDiscount = true;
                console.log('discount should contain at least 1 number');
                res.json({success: false, url: `/update-categoryOffer/${id}`})
                return;
            }

            //first update productdb with category offer
            const oldCategoryOffdata = await categoryOfferDB.findOne({ _id: id })
            const categoryDataUpdate = await productDB.updateMany({category : oldCategoryOffdata.category},
                {$set:{categoryofferDiscount : discount, categoryofferExpDate : expDate }})

            const newData = {category : trimmedCategory,
                            discount: discount,
                            expDate: expDate
                            }
            
            const updatedCategoryOffer = await categoryOfferDB.updateOne({ _id: id }, { $set: newData }, { new: true, useFindAndModify: false });

            if(updatedCategoryOffer.modifiedCount === 0) {
                console.log("category-offerr not found or not updated");
                res.status(200).json({ success: false, message: "category-offerr not found or not updated"});
            }else{
                console.log('category-offer details after updation', updatedCategoryOffer);
                console.log("category offer Updated successfully");
                req.session.categoryOfferUpdated = true;
                res.status(200).json({ success: true });
            }

        }catch(err){
            console.log(err);
        }
    },
};


//admin-deleteCategoryOffer- POST
const deleteCategoryOffer = {
    async removeCategoryOff(req, res) {
        try{
            const {id}=req.body;
            // first update productdb with category offer
            const removingCategoryOffdata = await categoryOfferDB.findOne({ _id: id })
            
            const categoryDataUpdate = await productDB.updateMany({category : removingCategoryOffdata.category},
                                        {$unset:{categoryofferDiscount :"", categoryofferExpDate: ""}})
            if(categoryDataUpdate.modifiedCount === 0){
                console.log('categoryOffer not removed in productDB');
            }else{
                console.log('categoryOffer removed in productDB');
            }

            const result = await categoryOfferDB.updateOne({_id:id}, {$set:{unlisted:true}});
            if (result.modifiedCount === 0) {
                console.log('No offer(category-offer) found with the provided ID');
                req.session.couponDeletionError = 'No product-offer found with the provided id';
                res.status(200).json({ success: false, message: "product not moved to unlisted" });
            } else {
                console.log('category offer moved to unlist');
                req.session.categoryOfferDeleted = true;
                res.status(200).json({ success: true });
            }
        }catch(err){
            console.error('Error deleting category offer:', err);
            req.session.couponDeletionError = 'An error occurred while trying to delete the category offer.';
            res.redirect("/offer-management");
        }
    },
};


//admin-recoverCategoryOffer - POST
const recoverCategoryOffer = {
    async recoverCategoryOff(req, res) {
        try{
            const {id}=req.body;

            // first update productdb with category offer
            const removingCategoryOffdata = await categoryOfferDB.findOne({ _id: id })
            
            const categoryDataUpdate = await productDB.updateMany({category : removingCategoryOffdata.category},
                {$set:{ categoryofferDiscount : removingCategoryOffdata.discount, categoryofferExpDate : removingCategoryOffdata.expDate }})
            if(categoryDataUpdate.modifiedCount === 0){
                console.log('categoryOffer not Added in productDb');
            }else{
                console.log('categoryoffer added in productDb');
            }

            const result = await categoryOfferDB.updateOne({_id:id}, {$set:{unlisted:false}});
            if (result.modifiedCount === 0) {
                console.log('No offer(category-offer) found with the provided ID');
                req.session.couponDeletionError = 'No category-offer found with the provided id';
                res.status(200).json({ success: false, message: "No category-offer found with the provided id" });
            } else {
                console.log('category offer recovered');
                req.session.categoryOfferRecovered = true;
                res.status(200).json({ success: true });
            }
        }catch(err){
            console.error('Error recover category offer:', err);
            req.session.couponDeletionError = 'An error occurred while trying to recover the category offer.';
            res.redirect("/offer-management");
        }
    },
};



module.exports = {changeStatus, addCoupon, updateCoupon, deleteCoupon, addProductOffer, updateProductOffer, deleteProductOffer,
                  addCategoryOffer, updateCategoryOffer, deleteCategoryOffer, recoverCoupon, recoverProductOffer, recoverCategoryOffer}



