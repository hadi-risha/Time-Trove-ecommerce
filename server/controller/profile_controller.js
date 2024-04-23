const userdbCollection = require("../model/model");      //user-register schema
const AddressDB =  require("../model/address-model");


// userprofile-edit - POST
const profileEdit = {
    async userProfile(req, res) {
      try {
      console.log('email',req.body.email);

      res.redirect('/edit-profile');
      }catch(error) {
        console.error('Error while editing profile', error);
        res.status(500).send('Internal Server Error');
      }
    },
  };


// saveProfile-details - POST
const saveDetails = {
async userDetails(req, res) {
    try{
      const {email, name, phno, gender} = req.body;
      console.log('email',email);
      const trimmedName = name.trim();
      const trimmedPhno = phno.trim();

      //validate phno
      if(!/^\d{10}$/.test(trimmedPhno)) {
        req.session.invalidNumber = true;
        console.log('number not included 10 digits');
        res.json({success: false, url: "/edit-profile"});
        return;
      }

      

      if (!/^[A-Za-z\s]+$/.test(trimmedName)) {
        req.session.invalidName = true;
        console.log('Name should only contain letters');
        res.json({success: false, url: "/edit-profile"});
        return;
      }
      if (!/\S+/.test(trimmedName)) {
        req.session.notValidName = true;
        console.log('Name is empty,field required');
        res.json({success: false, url: "/edit-profile"});
        return;
      }

      const newData={name : trimmedName,
                      phno : trimmedPhno,
                      email : email,
                      gender : gender}

      const updatedProfile = await userdbCollection.findOneAndUpdate({email:email}, { $set:newData}, { new: true, useFindAndModify: false });
          
      if(updatedProfile.modifiedCount === 0){
        console.log("profile not found or not updated");
        res.status(200).json({ success: false, message: "profile not updated" });
      }else{
        console.log('new profile details after updation',updatedProfile);
        console.log("profile Updated successfully");
        req.session.updatedProfile = true
        res.status(200).json({ success: true });
      }

    }catch(error) {
      console.error('Error while editing profile', error);
      res.status(500).send('Internal Server Error');
    }
  },
};


// userNewAddress - POST
const NewAddress = {
    async saveAddress(req, res) {
      try{
        if (!req.body.pincode || !req.body.state || !req.body.address || !req.body.district || !req.body.mobile) {
          console.log(pincode, state, address, district, mobile)
          console.log('required fields are missing');
          res.status(400).send('required fields are missing');
          return;
        }

        //trim details
        const {pincode, state, address, district, mobile} = req.body;
        const trimmedPincode = pincode.trim();
        const trimmedState = state.trim();
        const trimmedAddress = address.trim();
        const trimmedDistrict = district.trim();
        const trimmedPMobile = mobile.trim();

        //validate pincode
        if (!/^\d{6}$/.test(trimmedPincode)) {
          req.session.invalidPinCode = true;
          console.log("Invalid PIN code. Please enter a 6-digit numeric PIN code");
          res.redirect("/add-address");
          return;
        }
        
        if (!/^[A-Za-z\s]+$/.test(trimmedState)) {
          req.session.invalidState = true;
          console.log('Invalid state name,Please use only letters and spaces');
          res.redirect("/add-address");
          return;
        }
        if (!/\S+/.test(trimmedState)) {
          req.session.notValidState = true;
          console.log('state is empty,field required');
          res.redirect("/add-address");
          return;
        }
  
        if (trimmedAddress === '') {
          req.session.invalidAddress = true; 
          console.log('adress is empty,field required');
          res.redirect('/add-address');
          return;
        }
  
        if (trimmedDistrict === '') {
          req.session.notValidDistrict = true; 
          console.log('district is empty,field required');
          res.redirect('/add-address');
          return;
        }

        if (!/^[A-Za-z\s]+$/.test(trimmedDistrict)) {
          req.session.invalidDistrict = true;
          console.log('Invalid district name,Please use only letters and spaces');
          res.redirect("/add-address");
          return;
        }
  
        if (!/^\d{10}$/.test(trimmedPMobile)) {
          req.session.invalidMobile = true;
          console.log('mobile number not included 10 digits');
          res.redirect("/add-profile");
          return;
        }
  
        const { userEmail } = req.session;
        const newAddress = new AddressDB({
                            pincode: trimmedPincode,
                            state: trimmedState,     
                            address: trimmedAddress,
                            district: trimmedDistrict,
                            mobile: trimmedPMobile,          
                            addressType: req.body['address-type'],
                            email: userEmail
                          });
        console.log('new address before save in mongodb',newAddress);

        const result = await newAddress.save();
        console.log("address:",result);
          if(result){
            console.log('new address saved');
            req.session.addressSaved = true;
            res.redirect("/user-address")
          }
      }catch(err) {
        console.log('address error', err);
        res.send('Internal server err');
      }
    },
  };



// edit-address - POST
const editAddress = {
  async userAddress(req, res) {
    try{
      console.log("come hereeee---------..");
      const {id} = req.body;
      console.log('address id : ',id);
      const currentAddress = await AddressDB.findOne({_id : id});
      console.log('address details before updation',currentAddress);

      const { pincode, state, address, district, mobile, addressType} = req.body;
      const trimmedPincode = pincode.trim();
      const trimmedState = state.trim();
      const trimmedAddress = address.trim();
      const trimmedDistrict = district.trim();
      const trimmedPMobile = mobile.trim();
      const trimmedAddressType = addressType.trim();
      
      // validate pincode
      if (!/^\d{6}$/.test(trimmedPincode)) {
        req.session.invalidPinCode = true;
        console.log('pin number not included 6 digits');
        res.json({success: false, url: `/edit-address/${id}`});
        return;
      }
      

      // validate state
      if (trimmedState.length < 3) {
        req.session.invalidStateName = true;
        console.log('State should contain at least 3 letters');
        res.json({success: false, url: `/edit-address/${id}`});
        return;
      }
    
      // validate state
      if (!/^[A-Za-z ]+$/.test(trimmedState)) {
        req.session.invalidState = true;
        console.log('State should contain only letters');
        res.json({success: false, url: `/edit-address/${id}`});
        return;
      }

      // validate address
      if (trimmedAddress === '') {
        req.session.emptyAddress = true; 
        console.log('Address is empty,field required');
        res.json({success: false, url: `/edit-address/${id}`});
        return;
      }

      // validate state
      if (trimmedDistrict.length < 3) {
        req.session.invalidDistrictName = true;
        console.log('District should contain at least 3 letters');
        res.json({success: false, url: `/edit-address/${id}`});
        return;
      }
    
      // validate state
      if (!/^[A-Za-z ]+$/.test(trimmedDistrict)) {
        req.session.invalidDistrict = true;
        console.log('District should contain only letters');
        res.json({success: false, url: `/edit-address/${id}`});
        return;
      }

      // validate mobile
      if(!/^\d{10}$/.test(trimmedPMobile)) {
        req.session.invalidMobile = true;
        console.log('number not included 10 digits');
        res.json({success: false, url: `/edit-address/${id}`});
        return;
      }

      const newData = {pincode : trimmedPincode,
                          state : trimmedState,
                          address : trimmedAddress,
                          district : trimmedDistrict,
                          mobile : trimmedPMobile,
                          addressType : trimmedAddressType}

      const updatedAddress = await AddressDB.updateOne({ _id: id },{ $set: newData },{ new: true, useFindAndModify: false });
        
        if(updatedAddress.modifiedCount === 0){
          console.log("address not found or not updated");
          res.status(200).json({ success: false, message: "address not updated" });
        }else{
          console.log('new address details after updation',updatedAddress);
          console.log("Address Updated successfully");
          req.session.updatedAddress = true;
          res.status(200).json({ success: true });
        }

    }catch(error) {
      console.error('Error while editing profile', error);
      res.status(500).send('Internal Server Error');
    }
  },
};



// delete-address - POST
const deleteAddress = {
  async removeAddress(req, res) {
    try{
      console.log("coming here--------------mm");
      const {id} = req.body;
      console.log('address Id',id);

      const removedAddress = await AddressDB.findOneAndDelete({ _id: id });
        // if(removedAddress){
        //   console.log("Address Deleted successfully");
        //   res.redirect('/user-address');
        // }else{
        //   console.log("address not found or not updated");
        // }

        if(removedAddress.modifiedCount === 0) {
          console.log("address not found or not updated");
          res.status(200).json({ success: false, message: "address not found or not updated" });
        }else{
          console.log("Address Deleted successfully");
          req.session.userAddressRemoved = true;
          res.status(200).json({ success: true });
        }

        // res.redirect('/user-address');

    }catch(error) {
      console.error('Error while editing profile', error);
      res.status(500).send('Internal Server Error');
    }
  },
};








module.exports = {profileEdit, saveDetails, NewAddress, editAddress, deleteAddress}