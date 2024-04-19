const { Store } = require("express-session");
const path = require('path');
const multer = require("multer");

// setup multer storage
var storage=multer.diskStorage({
  destination:function(req,file,cb){
    const destinationPath = path.join(__dirname, '../../uploads');
    cb(null, destinationPath);          //null-handle error and next is img folder name
  },
  filename:function(req,file,cb){    //this property used to give unique names for imgs
    var ext = file.originalname.substring(file.originalname.lastIndexOf('.'));   //this will return the extension of the file(img.jpg) to ext variable
    cb(null,file.fieldname + '+' + Date.now() + ext);
  }
})

const store = multer({storage:storage })
module.exports = store;


