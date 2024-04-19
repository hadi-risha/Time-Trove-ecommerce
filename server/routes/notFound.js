const express=require("express");

const route=express.Router()

function isAuthenticate(req, res, next) {
  if(req.session.isAuth){
      next();
  }else{
      res.redirect('/admin');
  }
};

function notAuthenticate(req, res, next){
  if(req.session.isAuth){
      res.redirect('/adminHome');
  }else{
      next();
  }
};

route.get('*',(req, res) => {
    res.status(404).render('notFound')
  });

  module.exports=route