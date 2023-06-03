const express=require("express");
const app=express();
const product=require("./routes/productRoute")
const user=require("./routes/userRoutes")
const errorMiddleware=require("./middleware/error")
var cookieParser = require('cookie-parser')
const bodyParser = require("body-parser");
const path = require("path");

// Config
if (process.env.NODE_ENV !== "PRODUCTION") {
    require("dotenv").config({ path: "backend/config/config.env" });
  }


const fileUpload = require("express-fileupload");
app.use(express.json({ limit: "50mb" })); app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());

app.use("/api/v1",product);
app.use("/api/v1",user); 
app.post("/demo",(req,res)=>{
    res.json({
        name:"BigInt",
        price:45,
        
    })
})

app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../frontend/dist/index.html"));
});

app.use(errorMiddleware);
module.exports=app;