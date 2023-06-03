const ErrorHander = require("../utils/errorhandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Product=require("../models/productModel")
exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
        res.status(400).json({
            success:false,
      
          })
          return;
        // return next(new ErrorHander("Please Login to access this More Functionality", 401));
    }

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decodedData.id);

    next();
});
exports.isOwner=catchAsyncErrors(async (req,res,next)=>{

})