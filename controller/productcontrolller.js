const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Product = require("../models/productModel");
const ErrorHander = require("../utils/errorhandler");
// const ApiFeatures = require("../utils/apifeatures");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const cloudinary = require("cloudinary");
// const ErrorHandler = require("../utils/errorhandler");



// create new product 

// exports.createProduct = catchAsyncErrors(async (req, res, next) => {

//     const product = await Product.create(req.body);
//     res.status(201).json({
//         success: true,
//         product
//     })
// })

exports.createProduct = catchAsyncErrors(async (req, res, next) => {
    let images = [];
  
    if (typeof req.body.images === "string") {
      images.push(req.body.images);
    } else {
      images = req.body.images;
    }
    
    const imagesLinks = [];
    
    for (let i = 0; i < images.length; i++) {
      const result = await cloudinary.v2.uploader.upload(images[i], {
        folder: "products",
      });
      
      imagesLinks.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }
    
  
    req.body.images = imagesLinks;
    req.body.user = req.user.id;
  
    const product = await Product.create(req.body);
  
    res.status(201).json({
      success: true,
      product,
    });
  });

// get all products

exports.getAllProducts = catchAsyncErrors(async (req, res, next) => {
    // return next(new ErrorHander("this is temp error",404));

    try {
        const resultPerPage = 8;
        const productsCount = await Product.countDocuments();
        const page = parseInt(req.query.page) - 1 || 0;
        const limit = parseInt(req.query.limit) || 8;
        const keyword = req.query.keyword || "";
        let sort = req.query.sort || "createdAt";
        req.query.sort ? (sort = req.query.sort.split(",")) : (sort = [sort]);
        let sortBydate = 1;
        if (req.query.sortBydate=="true") {
            sortBydate = -1;
        }
        let sortByPrice = 1;
        if (req.query.sortByPrice === "true") {
            sortByPrice = -1;
        }
        let sortBy = {
            "price": sortByPrice,
            "createdAt": sortBydate,

        }
        let category = req.query.category || "All";
        const categoryOptions = [
            "faltu",
            "electronics",
            "mobile",
            "Laptop","Shoes"
        ];
        category === "All"
            ? (category = [...categoryOptions])
            : (category = req.query.category.split(","));


        let minprice = req.query.minprice || 0;
        let maxprice = req.query.maxprice || 100000;

        
        let products = await Product.find({
            name: { $regex: keyword, $options: "i" },
            price:{$gte:minprice, $lte:maxprice}
        }).where("category")
            .in([...category])
            .sort(sortBy)
            .skip(page * limit)
            .limit(limit);

        let filteredProducts = await Product.find({
            name: { $regex: keyword, $options: "i" },
            price:{$gte:minprice, $lte:maxprice}
        }).where("category")
            .in([...category]);
        let filteredProductsCount=filteredProducts.length;
            
            
        res.status(200).json({
            success: true,
            products,
            minprice,
            maxprice,
            productsCount,
            resultPerPage,
            filteredProductsCount,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: true, message: "Internal Server Error" });
    }

    

});

exports.getAdminProducts = catchAsyncErrors(async (req, res, next) => {
    try {
        const resultPerPage = 8;
        const productsCount = await Product.countDocuments();
        const page = parseInt(req.query.page) - 1 || 0;
        const limit = parseInt(req.query.limit) || 8;
        const email= req.params.email
        const keyword = req.query.keyword || "";
        let products = await Product.find({
            email:email,
            // name: { $regex: keyword, $options: "i" },
        })

        let filteredProducts = await Product.find({
            email:email,
            // name: { $regex: keyword, $options: "i" }
        })
        let filteredProductsCount=filteredProducts.length;
            
            
        res.status(200).json({
            email:email,
            success: true,
            products,
            
            productsCount,
            resultPerPage,
            filteredProductsCount,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: true, message: "Internal backend Server Error" });
    }

    
});



//gives product detail sigle product detail
exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return next(new ErrorHander("Product not found", 404));
    }

    res.status(200).json({
        success: true,
        product
    })


})

// modifiy product 
// exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
//     let product = await Product.findById(req.params.id);
//     if (!product) {
//         return next(new ErrorHander("Product not found", 404));
//     }
//     const { token } = req.cookies;

//     if (!token) {
//         return next(new ErrorHander("Please Login to access this resource", 401));
//     }

//     const decodedData = jwt.verify(token, process.env.JWT_SECRET);

//     const user = await User.findById(decodedData.id);

//     // const doc = await Character.findOneAndUpdate(filter, update, {
//     //     new: true
//     //   });
//     if(user.email!=product.email){
//         return next( new ErrorHander("this ad is not post by you",401))
//     }
//     product = await Product.findByIdAndUpdate(req.params.id, req.body, {

//         new: true,

//         runValidators: true,
//         useFindAndModify: false
//     })
//     res.status(200).json({
//         success: true,
//         product

//     })

// })

exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
    let product = await Product.findById(req.params.id);
  
    if (!product) {
      return next(new ErrorHander("Product not found", 404));
    }
    const { token } = req.cookies;

    if (!token) {
        return next(new ErrorHander("Please Login to access this resource", 401));
    }

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decodedData.id);

    // const doc = await Character.findOneAndUpdate(filter, update, {
    //     new: true
    //   });
    if(user.email!=product.email){
        return next( new ErrorHander("this ad is not post by you",401))
    }
  
    // Images Start Here
    let images = [];
  
    if (typeof req.body.images === "string") {
      images.push(req.body.images);
    } else {
      images = req.body.images;
    }
  
    if (images !== undefined) {
      // Deleting Images From Cloudinary
      for (let i = 0; i < product.images.length; i++) {
        await cloudinary.v2.uploader.destroy(product.images[i].public_id);
      }
  
      const imagesLinks = [];
  
      for (let i = 0; i < images.length; i++) {
        const result = await cloudinary.v2.uploader.upload(images[i], {
          folder: "products",
        });
  
        imagesLinks.push({
          public_id: result.public_id,
          url: result.secure_url,
        });
      }
  
      req.body.images = imagesLinks;
    }
  
    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });
  
    res.status(200).json({
      success: true,
      product,
    });
  });

// delete product \
exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return next(new ErrorHander("Product not found", 404));
    }
    const { token } = req.cookies;

    if (!token) {
        return next(new ErrorHander("Please Login to access this resource", 401));
    }

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);

    user = await User.findById(decodedData.id);
    if(user.email!==product.email){
        return next(new ErrorHander("this ad is not created by you",401))
    }


    const k = await Product.findOneAndRemove({ _id: req.params.id });
    res.status(200).json({
        success: true,
        message: "Product Deleted Successfuly"
    })

})
