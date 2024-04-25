const express = require("express");
const router = express.Router();
const store = require("../middlewares/multer");               //multer middleware
const { isAuthenticate, notFoundHandler, Authenticate } = require('../middlewares/adminSideMiddlewares');


//all GET functions
const {getAdminLogin,getAdminHome, getuserManagement, getUserSearchResult, getAdminAddProduct,getProductManagement,
       getAdminUnlistedProduct,getUpdateProduct, getCategoryManagement,getUnlistedCategory,getAddCategory,getEditCategory,
       getOrderManagement, getCouponManagement, getAddCoupon, getUpdateCoupon, getOfferManagement,
       getAddProductOffer, getUpdateProductOffer, getAddCategoryOffer, getUpdateCategoryOffer,
       getReferralOffer, getAddReferralOffer, getUpdateReferralOffer, getUnlistedCoupon, getUnlistedOffers} = require('../services/admin_render');

const { adminLoginPost, adminLogout, userManagement, blockUnblockUser}=require('../controller/adminController');

const {addproduct, updateProduct, deleteImage, deleteProduct, recoverProduct} = require('../controller/adminProduct_controller');
  
const {addCategory, editCategory, deleteCategory, recoverCategory} = require('../controller/category_controller');

const {changeStatus, addCoupon, updateCoupon, deleteCoupon, addProductOffer, updateProductOffer,deleteProductOffer,
       addCategoryOffer, updateCategoryOffer, deleteCategoryOffer,recoverCoupon, recoverProductOffer,
       recoverCategoryOffer} = require('../controller/adminOrder_controller');


const {addReferralOffer, updateReferralOffer, deleteReferralOffer } = require ('../controller/adminReferraloffer_controller');

const {bestSellingItems, bestSellingcategory, bestSellingBrands, downloadSalesReport, downloadExcel} = require ("../controller/dashboardController")

// const {} = require('../controller/adminCoupon_controller');


/************* adminSide Routes ****************/ 

router.get('/admin', Authenticate, getAdminLogin.adminLogin);

router.post("/admin", Authenticate, adminLoginPost.adminlogin); 

router.post("/ad-logout", adminLogout.adminsignout);


//admin dashboard
router.get("/adminHome", isAuthenticate,  getAdminHome.adminHome);

router.get("/pdf-salesReport", downloadSalesReport.download);          //pdf file

router.get("/excel-salesReport", downloadExcel.downloadSalesReport)           //excel

router.get("/bestSellingProducts", isAuthenticate, bestSellingItems.bestProduct);   

router.get("/bestSellingCategories", isAuthenticate, bestSellingcategory.bestCategory); 

router.get("/bestSellingBrands", isAuthenticate, bestSellingBrands.bestBrand);   


//user-management section
router.get("/user-management", isAuthenticate,  getuserManagement.uManagement);

router.post("/user-management", isAuthenticate, userManagement.uManagement);   // temp

router.post('/user-management/:userId', isAuthenticate, blockUnblockUser.userManage);  

router.get('/adminFilterUsers', isAuthenticate, getUserSearchResult.userManagement);  


//Product Management section
router.get("/add-product", isAuthenticate, getAdminAddProduct.addProduct);

router.post('/add-product', isAuthenticate,store.array('images',6), addproduct.addProd);      //images is the img input fieldname and 15 is the limit,the middleware create a file method.

router.get("/adminProductManagement", isAuthenticate,  getProductManagement.productManage );

router.get("/adminUnlisted-product", isAuthenticate,  getAdminUnlistedProduct.unlistedProduct);

router.get("/update-product", isAuthenticate,  getUpdateProduct.updateProduct); 

router.post("/update-product", isAuthenticate, store.array('images',6), updateProduct.updateProd);       //must add multer middleware (also include it in EJS), otherwise get an error.

router.post("/update-deleteImage", isAuthenticate, deleteImage.deleteImg);

router.patch("/delete-product", isAuthenticate, deleteProduct.deleteProd);

router.patch("/recover-product", isAuthenticate, recoverProduct.recoverProd);


//category Management section
router.get("/category-management", isAuthenticate, getCategoryManagement.categoryManagement);  

router.get("/unlisted-category", isAuthenticate, getUnlistedCategory.unlistedCategory);

router.get("/add-category", isAuthenticate, getAddCategory.addCategory);

router.post("/add-category", isAuthenticate, addCategory.addCat);

router.get("/edit-category/:id", isAuthenticate, getEditCategory.updateCategory);   

router.patch("/edit-category", isAuthenticate, editCategory.updateCategory);

router.patch("/delete-category", isAuthenticate, deleteCategory.removeCat);

router.patch("/recover-category", isAuthenticate, recoverCategory.recoverCat);


//order management section
router.get("/order-management", isAuthenticate, getOrderManagement.orderManagement);   

router.post("/admin-productStatus", isAuthenticate, changeStatus.orderProductstatus);


//coupon management section
router.get("/coupon-management", isAuthenticate, getCouponManagement.couponManage);   

router.get("/add-coupon",isAuthenticate, getAddCoupon.createCoupon);

router.post("/add-coupon", isAuthenticate, addCoupon.createCoupon);

router.get("/update-coupon/:id",isAuthenticate, getUpdateCoupon.editCoupon);

router.patch("/update-coupon", isAuthenticate, updateCoupon.editCoupon);

router.patch("/delete-coupon", isAuthenticate, deleteCoupon.removeCoupon);

router.get("/unlisted-coupon", isAuthenticate, getUnlistedCoupon.couponManage);  

router.patch("/recover-coupon", isAuthenticate, recoverCoupon.manageCoupon);



//offer management section
router.get("/offer-management",isAuthenticate, getOfferManagement.manageOffer );

router.get("/unlisted-offers",isAuthenticate, getUnlistedOffers.unlistedOffers );

//***(product offer)***
router.get('/add-ProductOffer',isAuthenticate, getAddProductOffer.createProductOffer );

router.post('/add-ProductOffer', isAuthenticate,addProductOffer.productDiscount );

router.get("/update-productOffer/:id",isAuthenticate, getUpdateProductOffer.editProductOffer ); 

router.patch('/update-ProductOffer', isAuthenticate, updateProductOffer.productDiscount );

router.patch('/delete-productOffer', isAuthenticate, deleteProductOffer.removeproductOff );

router.patch('/recover-productOffer', isAuthenticate, recoverProductOffer.recoverproductOff );

//***(category offer)***
router.get('/add-categoryOffer',isAuthenticate, getAddCategoryOffer.createProductOffer );

router.post('/add-categoryOffer', isAuthenticate,addCategoryOffer.categoryOffer );

router.get("/update-categoryOffer/:id",isAuthenticate, getUpdateCategoryOffer.editCategoryOffer ); 

router.patch('/update-categoryOffer', isAuthenticate, updateCategoryOffer.categoryUpdate );  

router.patch('/delete-categoryOffer', isAuthenticate, deleteCategoryOffer.removeCategoryOff);

router.patch('/recover-categoryOffer', isAuthenticate, recoverCategoryOffer.recoverCategoryOff);


// referral-offer management section
router.get("/referralOffer-management", isAuthenticate, getReferralOffer.referralOffer);

router.get("/add-referralOffer", isAuthenticate, getAddReferralOffer.createReferralOffer);

router.post('/add-referralOffer', isAuthenticate, addReferralOffer.createOffer);

router.get("/update-referralOffer", isAuthenticate, getUpdateReferralOffer.editReferralOffer);

router.patch("/update-referralOffer", isAuthenticate, updateReferralOffer.editOffer);

router.delete("/delete-referralOffer/:id", isAuthenticate, deleteReferralOffer.removeOffer);


/************* end of adminSide Routes ****************/ 









module.exports = router;