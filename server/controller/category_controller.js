const categoryDB = require("../model/categoryModel");


//add-category - POST
const addCategory = {
    async addCat(req, res) {
        try{
            const {category} = req.body;
            const trimmedCategory = category.trim();
            
            //validate category name
            if(trimmedCategory.length < 2) {
                req.session.invalidCategoryName = true;
                console.log('Category must contain at least 2 letters');
                res.redirect(`/add-category`);
                return;
            } 
            
            //validate state
            if(!/^[A-Za-z ]+$/.test(trimmedCategory)) {
                req.session.invalidCategory = true;
                console.log('Category should contain only letters');
                res.redirect(`/add-category`);
                return;
            }

            const result = await categoryDB.findOne({ category: trimmedCategory });
            if(result) {
            //A category already exists
            req.session.categoryExist = true;
            res.redirect("/add-category");
            return;
            }

            const newCategory = new categoryDB({ category: trimmedCategory });

            const categoryData = await newCategory.save();
            if(categoryData){
                console.log('successfully created new category');
                req.session.categoryAdded = true;
                res.redirect('/add-category');
            }
        }catch(err){
            console.log('register err', err);
            res.send('Internal server err');
        }
    },
};


 //edit-category - POST
const editCategory = {
    async updateCategory(req, res) {
        try {
            const {id, category} = req.body;
            const trimmedCategory = category.trim();
            
            //validate category name
            if (trimmedCategory.length < 2) {
                req.session.invalidCategoryName = true;
                console.log('Category must contain at least 2 letters');
                res.json({success: false, url: `/edit-category/${id}`});
                return;
            } 

            if (!/^[A-Za-z ]+$/.test(trimmedCategory)) {
                req.session.invalidCategory = true;
                console.log('Category should contain only letters');
                res.json({success: false, url: `/edit-category/${id}`});
                return;
            }

            //checking if the category already exists
            const result = await categoryDB.find({ category: trimmedCategory });
            if(result.length > 0){
                // A category already exists
                console.log('category already exist,choose another category', result);
                req.session.categoryExist = true;    
                res.json({success: false, url: `/edit-category/${id}`});
                return;
            }

            //update category
            const updatedCategory = await categoryDB.findOneAndUpdate({_id: id}, { $set:{category:trimmedCategory} }, { new: true, useFindAndModify: false });
            
            if(updatedCategory.modifiedCount === 0){
                console.log("category not found or not updated");
                res.status(200).json({ success: false, message: "category not found or not updated" });
            }else{
                console.log('category details after updation',updatedCategory);
                console.log("category Updated successfully");
                req.session.updatedCategory = true;
                res.status(200).json({ success: true });
            }
        }catch(err) {
            console.log('Update category error:', err);
            res.status(500).send('Internal server error');
        }
    },
};


//delete-category - POST
const deleteCategory = {
    async removeCat(req, res) {
        const {id}=req.body;

        const result = await categoryDB.updateOne({_id:id},{$set:{unlisted:true}}, {new: true});
        if(result.modifiedCount === 0){
            console.log("category not moved to unlisted");
            res.status(200).json({ success: false, message: "category not moved to unlisted" });
        }else{
            console.log("category moved to unlisted");
            req.session.categoryDeleted = true;
            res.status(200).json({ success: true });
        }
    },
};


//recover-category - POST
const recoverCategory = {
    async recoverCat(req, res) {
        const {id}=req.body;

        const result = await categoryDB.updateOne({_id:id},{$set:{unlisted:false}});
        if(result.modifiedCount === 0){
            console.log("category not recovered");
            res.status(200).json({ success: false, message: "category not recovered" });
        }else{
            console.log("category recovered from unlisted");
            req.session.categoryRecovered = true;
            res.status(200).json({ success: true });
        }
    },
};




module.exports = {addCategory, editCategory, deleteCategory, recoverCategory }