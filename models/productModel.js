const mongoose = require("mongoose")
const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "please enter product name"]
    },
    price: {
        type: Number,
        required: [true, "please enter product price"]
    },
    email: {
        type: String,
        required: [true, "email not found"]

    },
    images: [
        {
            public_id: {
                type: String,
                required: true
            },
            url: {
                type: String,
                required: true
            }
        }
    ],
    category:{
        type:String,
        required:[true,"category not found"]
    },
    available:{
        type:Boolean,
        required:[true,"avilable value not found"]
    },
    createdAt:{
        type:Date,
        default:Date.now

    },
    mobileNumber:{
        type:Number,
        required:[true,"mobile number not found"]

    },
    description:{
        type:String,

    },
    address:{
        type:String,
        

    }

})
module.exports=mongoose.model("Product",productSchema);