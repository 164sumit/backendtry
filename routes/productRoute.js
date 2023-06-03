const express = require("express");
const { getAllProducts, createProduct, updateProduct, deleteProduct, getProductDetails, getAdminProducts } = require("../controller/productcontrolller");
const { isAuthenticatedUser } = require("../middleware/auth");
const router = express.Router();

router.route("/products").get(getAllProducts)
router.route("/product/new").post(isAuthenticatedUser, createProduct)
router.route("/admin/products/:email").get(isAuthenticatedUser,getAdminProducts);
router.route("/product/:id")
    .put(updateProduct)
    .delete(deleteProduct)
    .get(getProductDetails)




module.exports = router