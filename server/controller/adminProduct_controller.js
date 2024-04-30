
const productDB =require("../model/productModel");
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const ProductOfferDB = require("../model/offer-ProductModel");
const categoryOfferDB = require("../model/offer-CategoryModel");



//add-product - POST
const addproduct = {
    async addProd(req, res, next) {
        let {pName, category, pDescription, fPrice, lPrice, discount, quantity} = req.body;
        console.log('lprice',lPrice);
        const discountInNumber = Math.round(fPrice * discount) % 100;
        lPrice = fPrice - discountInNumber

        const trimmedPName = pName.trim();
        const trimmedPDescription = pDescription.trim();
        const trimmedFPrice = fPrice.trim();
        const trimmedLPrice = fPrice - discount
        const trimmedDiscount = discount.trim();
        const trimmedQuantity = quantity.trim();

        //validate pname
        if (trimmedPName.length < 2) {
            req.session.invalidproductName = true;
            console.log('product name should contain at least 2 letters');
            res.redirect('/add-product');
            return;
        }

        //validate pname
        if (!/^[A-Za-z ]+$/.test(trimmedPName)) {
            req.session.notValidpName = true;
            console.log('product name should contain only letters');
            res.redirect('/add-product');
            return;
        }

        //validate pDescription
        if (trimmedPDescription === '') {
            req.session.emptypDescription = true; 
            console.log('description is empty,field required');
            res.redirect('/add-product');
            return;
        }

        //validate fPrice
        if (!/^(?:\d*\.)?\d+$/.test(trimmedFPrice)) {
            console.log('Please provide non-negative values for fPrice.');
            req.session.negativeFPrice = true;
            res.redirect('/add-product');
            return;
        }

        // validate fPrice
        if (!/\d{2,}/.test(trimmedFPrice)) {
            req.session.invalidFPrice = true;
            console.log('first price should contain at least 2 numbers');
            res.redirect('/add-product');
            return;
        }

        //validate lprice
        if (!/^(?:\d*\.)?\d+$/.test(trimmedLPrice)) {
            console.log('Please provide non-negative values for lPrice.');
            req.session.negativeLPrice = true;
            res.redirect('/add-product');
            return;
        }

        // validate lPrice
        if (!/\d{2,}/.test(trimmedLPrice)) {
            req.session.invalidLPrice = true;
            console.log('Price should contain at least 2 numbers');
            res.redirect('/add-product');
            return;
        }

        //validate discount
        if (!/^(?:\d*\.)?\d+$/.test(trimmedDiscount)) {
            console.log('Please provide non-negative values for discount.');
            req.session.negativeDiscountValue = true;
            res.redirect('/add-product');
            return;
        }

        //check if discount is within the valid percentage range (1-99)
        if (trimmedDiscount < 1 || trimmedDiscount > 99) {
            console.log('Discount percentage should be between 1 and 99.');
            req.session.notValidDiscount = true;
            res.redirect('/add-product');
            return;
        }

        //validation for discount exceeding 100
        if (trimmedDiscount > 100) {
            console.log('Discount percentage cannot exceed 100.');
            req.session.invalidPercentage = true;
            res.redirect('/add-product');
            return;
        }

        //validate discount
        if (!/\d{1,}/.test(trimmedDiscount)) {
            req.session.invalidDiscount = true;
            console.log('discount should contain at least 1 number');
            res.redirect('/add-product');
            return;
        }

        //validate qty
        if (!/^(?:\d*\.)?\d+$/.test(trimmedQuantity)) {
            console.log('Please provide non-negative values for qty.');
            req.session.negativeQtyValue = true;
            res.redirect('/add-product');
            return;
        }

        //validate quantity
        if (!/\d{1,}/.test(trimmedQuantity)) {
            req.session.invalidQtyValue = true;
            console.log('quantity should contain at least 1 number');
            res.redirect('/add-product');
            return;
        }


        const files = req.files           //with this, we can access all the images
        //only upload images with valid extensions, ignore any other files
        const allowedImageExtensions = /\.(png|jpeg|jpg|gif|bmp)$/i;
        if(!req.files.every(file => allowedImageExtensions.test(file.originalname))) {
            req.session.invalidImage = true;
            console.log('Please upload valid image files with extensions: .png, .jpeg, .jpg, .gif, .bmp');
            res.redirect('/add-product');
            return;
        }
        if(!files){
            const error = new Error ('Please choose files');
            error.httpStatusCode = 400;
            return next(error)
        }
   
        // image crop
        files.forEach(async (file) => {
            await sharp(path.join(__dirname, `../../uploads/${file.filename}`))
                .resize(635, 640, {
                    fit: "cover",
                    position: "centre",
                })
                .toFile(path.join(__dirname, `../../uploads/resizedImg${file.filename}`));
        });

        let imgArray = files.map((file)=>{  return `/uploads/resizedImg${file.filename}`});
        // end of image crop


        // check the category offer exist
        let categoryOffDisc = null;
        let categoryOffExp = null;

        let categoryOfferExist = await categoryOfferDB.findOne({ category: category });
        
        if(categoryOfferExist){
            categoryOffDisc = categoryOfferExist.discount;
            categoryOffExp = categoryOfferExist.expDate;
        }


        productDB.findOne({ $and: [{ productName: pName }, { category: category }] })
        .then( async existingProduct => {
            if(existingProduct){
                req.session.duplicateProductName = true;
                console.log('Duplicate product name and category detected. Please choose a different name or category.');
                res.redirect('/add-product');
            }else{
                //no duplicate product found,so add new product
                console.log("no document were match for the query");

                //create new product details
                let newProduct = new productDB({
                        productName: trimmedPName,
                        category: category,
                        productDescription: trimmedPDescription,
                        firstPrice: trimmedFPrice,
                        lastPrice: trimmedLPrice,
                        discount: trimmedDiscount,
                        quantity: trimmedQuantity,
                        images: imgArray,
                        categoryofferDiscount : categoryOffDisc,
                        categoryofferExpDate : categoryOffExp
                });

                try{
                    const result = await newProduct.save();
                    if(result) {
                        req.session.productAdded = true;
                        res.redirect('/add-product');
                    }
                }catch(error) {
                    console.error('Error adding new product:', error);
                    res.status(500).send('Internal server error');
                }
            }
        })
        .catch(error => {
            console.error('Error checking for duplicate product/ adding new product', error);
            res.status(500).send('Internal server error');
        });
    },
};


//update-product - POST
const updateProduct = {
    async updateProd(req, res) {


        console.log(req.body);

        const productId = req.body.id;
        const files = req.files;


        console.log("img inpfield",req.body.images);
        console.log("imgs....",files);
        const {pName, category, pDescription, fPrice, lPrice, discount, quantity} = req.body;
        console.log("..............vallll.",pName, category, pDescription, fPrice, lPrice, discount, quantity)


        const trimmedPName = pName.trim();
        const trimmedPDescription = pDescription.trim();
        const trimmedFPrice = fPrice.trim();
        const trimmedLPrice = lPrice ? lPrice.trim() : lPrice;
        const trimmedDiscount = discount.trim();
        const trimmedQuantity = quantity.trim();

         // validate pname
         if (trimmedPName.length < 2) {
            req.session.enterValidProductName = true;
            console.log('product name should contain at least 2 letters');
            res.redirect(`/update-product?productId=${productId}`);
            return;
        }

        // validate pname
        if (!/^[A-Za-z ]+$/.test(trimmedPName)) {
            req.session.notValidProName = true;
            console.log('product name should contain only letters');
            res.redirect(`/update-product?productId=${productId}`);
            return;
        }

        // validate pDescription
        if (trimmedPDescription === '') {
            req.session.emptypDscrptn = true; 
            console.log('description is empty,field required');
            res.redirect(`/update-product?productId=${productId}`);
            return;
        }

        //validate fPrice
        if (!/^(?:\d*\.)?\d+$/.test(trimmedFPrice)) {
            console.log('Please provide non-negative values for fPrice.');
            req.session.negativeFirstPrice = true;
            res.redirect(`/update-product?productId=${productId}`);
            return;
        }

        // validate fPrice
        if (!/\d{2,}/.test(trimmedFPrice)) {
            req.session.invalidFirstPrice = true;
            console.log('first price should contain at least 2 numbers');
            res.redirect(`/update-product?productId=${productId}`);
            return;
        }

        // //validate lprice
        // if (!/^(?:\d*\.)?\d+$/.test(trimmedLPrice)) {
        //     console.log('Please provide non-negative values for lPrice.');
        //     req.session.negativeLastPrice = true;
        //     res.redirect(`/update-product?productId=${productId}`);
        //     return;
        // }

        // // validate lPrice
        // if (!/\d{2,}/.test(trimmedLPrice)) {
        //     req.session.invalidLastPrice = true;
        //     console.log('Price should contain at least 2 numbers');
        //     res.redirect(`/update-product?productId=${productId}`);
        //     return;
        // }

        //validate discount
        if (!/^(?:\d*\.)?\d+$/.test(trimmedDiscount)) {
            console.log('Please provide non-negative values for discount.');
            req.session.negativeDiscount = true;
            res.redirect(`/update-product?productId=${productId}`);
            return;
        }
        // Validate if discount is within the valid percentage range (1-99)
        if (trimmedDiscount < 1 || trimmedDiscount > 99) {
            console.log('Discount percentage should be between 1 and 99.');
            req.session.notValidDscnt = true;
            res.redirect(`/update-product?productId=${productId}`);
            return;
        }

        // Additional validation for discount exceeding 100
        if (trimmedDiscount > 100) {
            console.log('Discount percentage cannot exceed 100.');
            req.session.notValidPercentage = true;
            res.redirect(`/update-product?productId=${productId}`);
            return;
        }

        // validate discount
        if (!/\d{1,}/.test(trimmedDiscount)) {
            req.session.invalidDiscnt = true;
            console.log('discount should contain at least 1 number');
            res.redirect(`/update-product?productId=${productId}`);
            return;
        }

        //validate qty
        if (!/^(?:\d*\.)?\d+$/.test(trimmedQuantity)) {
            console.log('Please provide non-negative values for qty.');
            req.session.negativeQty = true;
            res.redirect(`/update-product?productId=${productId}`);
            return;
        }

        // validate quantity
        if (!/\d{1,}/.test(trimmedQuantity)) {
            req.session.invalidQty = true;
            console.log('quantity should contain at least 1 number');
            res.redirect(`/update-product?productId=${productId}`);
            return;
        }
        
        
        const existingProduct = await productDB.findById(productId);
            if(!existingProduct) {
                console.log("Product not found");
                return res.redirect('/adminProductManagement');
            }


        //update productName also update productOfferDb product-name
        const isProExistInproductOffer = await ProductOfferDB.findOneAndUpdate({ product : existingProduct.productName},
                                                                 {$set: {product : trimmedPName}}, { new: true }); 
            if (!isProExistInproductOffer) {
                console.log('no products found with the old name in productOfferDb, so not updating with new name');
            }else{
                console.log("Product found with the old name in ProductOfferDB. Successfully updated with the new name.");
            }


        const existingImages = existingProduct.images || [];
        const newImages = files?.map(file => `/uploads/${file.filename}`);

        let updatedImages;
        if( newImages || newImages?.length ){
            updatedImages = [...existingImages, ...newImages];
        }else{
            updatedImages = [...existingImages];
        }

        //only upload images with valid extensions, ignore any other files
        const allowedImageExtensions = /\.(png|jpeg|jpg|gif|bmp)$/i;
        if ((req.files || req.files?.length) && !req.files.every(file => allowedImageExtensions.test(file.originalname))) {
            req.session.imagenotvalid = true;
            console.log('Please upload valid image files with extensions: .png, .jpeg, .jpg, .gif, .bmp');
            res.redirect(`/update-product?productId=${productId}`);
            return;
        }

        console.log('new details before the updation',req.body);
        const newDetails ={
            productName: trimmedPName,   
            category: category,
            productDescription: trimmedPDescription,
            firstPrice: trimmedFPrice,
            lastPrice: trimmedLPrice,
            discount: trimmedDiscount,
            quantity: trimmedQuantity,
            images: updatedImages,
        }
      
        try{
            const updatedProduct = await productDB.findByIdAndUpdate({_id:productId}, { $set:newDetails}, { new: true, useFindAndModify: false});
            if(updatedProduct.modifiedCount === 0) {
                console.log("Product not found or not updated");
                res.redirect("/adminProductManagement");
            }else{
                console.log("Product Updated successfully");
                console.log('new details after updation',updatedProduct);
                req.session.productUpdated = true;
                res.redirect("/adminProductManagement");
            }
        }catch(error) {
            console.error('Error updating product:', error);
        }   
    },
};


//delete-image(update) - POST
const deleteImage = {
    async deleteImg(req, res) {
        try{
            const { imageUrl } = req.body;
            const result = await productDB.updateOne( { 'images': imageUrl} , { $pull: { images: imageUrl }} );
                if (result.nModified > 0) {
                    console.log("img Successfully deleted");
                    res.status(204).send(); 
                }else{
                    res.status(404).send({ error: 'Image not found' });
                }
        }catch(error) {
            console.error('Error:', error);
            res.status(500).send({ error: 'Internal Server Error' });
        }
    },
};


//delete-product - POST
const deleteProduct = {
    async deleteProd(req, res) {
        const {id} = req.body;

        let result = await productDB.updateOne({_id:id},{$set:{unlisted:true}}, {new: true});
        if(result.modifiedCount === 0){
            console.log("product not moved to unlisted");
            res.status(200).json({ success: false, message: "product not moved to unlisted" });
        }else{
            console.log("product moved to unlisted");
            req.session.productDeleted = true;
            res.status(200).json({ success: true });
        }
    },
};


//recover-product - POST
const recoverProduct = {
    async recoverProd(req, res) {
        const {id} = req.body;

        const result = await productDB.updateOne({_id:id},{$set:{unlisted:false}}, {new: true});
        req.session.productRecovered = true;

        if(result.modifiedCount === 0){
            console.log("product not recovered");
            res.status(200).json({ success: false, message: "product not recovered" });
        }else{
            console.log("product recovered from unlisted");
            req.session.productRecovered = true;
            res.status(200).json({ success: true });
        }
    },
};



module.exports = {addproduct, updateProduct, deleteImage, deleteProduct, recoverProduct}