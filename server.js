const express=require('express');
const dotenv=require('dotenv');
const bodyparser=require('body-parser');     //middleware for parsing POST form data
const path=require("path");
const session=require("express-session")
const connectDB = require("./server/database/connection");
const UserRouter = require('./server/routes/userRouter');
const AdminRouter = require('./server/routes/adminRouter');
const morgan = require('morgan');
const fs = require('fs');


const app=express();

app.use(bodyparser.json());

app.use(
    session({
      secret: "time trove",
      resave: false,
      saveUninitialized: true,
    })
  );

app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); 
    res.setHeader("Pragma", "no-cache"); 
    res.setHeader("Expires", "0"); 
    next();
})

dotenv.config({path:'config.env'});

//middleware for parsing mongoDb data with Express
app.use(express.urlencoded({extended:true}));

app.use(morgan('dev'));

connectDB();

//this middleware for JSON parsing
app.use(express.json());

app.set('view engine','ejs')

//loading public assets
app.use("/css",(express.static(path.join(__dirname,"public/css"))));
app.use("/ejs",(express.static(path.join(__dirname,"public/js"))));
app.use("/img",(express.static(path.join(__dirname,"public/img"))));
app.use("/uploads",(express.static(path.join(__dirname,"uploads"))));


app.use('/', UserRouter);        // Or app.use('/',require('./server/routes/router'))
app.use('/', AdminRouter)


function notFoundHandler(req, res, next) {
  console.log("status(404) , Page Not Found");
  res.status(404).render('404');
 }
app.all('*', notFoundHandler);



const PORT=process.env.PORT || 9001;
app.listen(PORT,(req,res)=>{console.log(`server running on http://localhost:${PORT}`)});




// cd time-trove/