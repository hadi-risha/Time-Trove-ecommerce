const userdbCollection = require("../model/model");

//admin - POST    (login) 
const adminLoginPost = {
    adminlogin(req, res) {
        
        const userName = process.env.ADMIN_NAME;
        const password = process.env.ADMIN_PASS;
        
        const inputPassword = req.body.pass;
        const inputUserName = req.body.name;
        
        if(password === inputPassword && userName === inputUserName) {
            req.session.isAuth = true;
            res.redirect("/adminHome");               
        }else{
            req.session.invalidCredentials = true;
            res.redirect("/admin");
        }
    },
};


//ad-logout - POST
const adminLogout = {
    adminsignout(req, res) {
        req.session.destroy();
        res.redirect("/admin");
    },
};


//user-management - POST
const userManagement = {          // no need
    uManagement:async (req, res) =>{
        const email = req.body.email;
        try{
            const userDetails = await userdbCollection.find();
            res.render('user_management', { userDetails });
        }catch(err) {
            console.log('register err', err);
        }
        
        //block and unblock section
        const {userId} = req.params;
        try{
            const user = await userdbCollection.findOne({_id: userId});
                if(!user) {
                    console.log('User not found');
                    return res.status(404).json({ message: 'User not found' });
                }

                if(user.isBlocked === false){
                    await userdbCollection.updateOne({ _id: userId },{ $set: { isBlocked: true } });
                }else{
                    await userdbCollection.updateOne({ _id: userId },{ $set: { isBlocked: false } });
                }
                res.redirect('/user-management');
        }catch(err) {
            console.log('user block/unblock error:', err);
            res.status(500).json({ message: 'Internal Server Error' });
        } 
    },
};


//block and unblock (user-management) - POST       (imp)
const blockUnblockUser = {
    userManage: async (req, res) =>{
        try {
            const {userId} = req.params;
            const user = await userdbCollection.findOne({_id: userId});
            if(!user) {
                console.log('User not found');
                return res.status(404).json({ message: 'User not found' });
            }

            //checking user to block
            if(user.isBlocked == false){
                await userdbCollection.updateOne({ _id: userId },{ $set: { isBlocked: true } });
                req.session.userBlocked= true;          //means user blocked
                req.session.isUserAuthenticated = false; 
                console.log('user blocked');
            }else{
                await userdbCollection.updateOne({ _id: userId },{ $set: { isBlocked: false } });
                req.session.userBlocked= false;
            }
            user.save();
            res.redirect('/user-management'); 
        }catch(err) {
            console.log('user block/unblock error:', err);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
};



module.exports = { adminLoginPost, adminLogout,  userManagement, blockUnblockUser};