const express = require("express");
const router = express.Router();
const { uploadImg } = require("../middleware/uploadImg");
const { userCheck, admin, owner } = require("../middleware/userCheck");
//auth
const { register, login, auth } = require("../controller/auth");

router.post("/register", register);
router.post("/login", login);
router.get("/login", userCheck, auth);
// user
const {
  addUser,
  getUsers,
  getUser,
  updateUser,
  updateUserData,
  deleteUser,
  getUserRestos,
  profileMe,
} = require("../controller/user");

router.get("/profile", userCheck, profileMe);

router.post("/user", uploadImg("image"), addUser);
router.get("/users", getUsers);
router.get("/user/:id", getUser);
router.get("/user/resto/:id", getUserRestos);
router.patch("/user", userCheck, uploadImg("image"), updateUser);
router.patch("/userData", userCheck, updateUserData);
router.delete("/user/:id", deleteUser);

//product
// TODO: delete product, edit product ,get product
const {
  addProduct,
  getProducts,
  getProductsAll,
  getProductsRand10,
  getProduct,
  editProduct,
  deleteProduct,
} = require("../controller/product");

router.post("/add/product/", userCheck, owner, uploadImg("image"), addProduct);
router.get("/products", userCheck, owner, getProducts);
router.get("/products/all", getProductsAll);
router.get("/products/random", getProductsRand10);
router.get("/product/:id", userCheck, owner, getProduct);
router.patch(
  "/product/:id",
  userCheck,
  owner,
  uploadImg("image", true),
  editProduct
);
router.delete("/product/:id", userCheck, owner, deleteProduct);

// resto
// TODO: add resto , get resto{ +owner } , edit resto , delete resto
const {
  addResto,
  getRestos,
  getResto,
  editResto,
  deleteResto,
  getRestoId,
  getRestoUser,
} = require("../controller/resto");

router.post("/add/resto", userCheck, owner, uploadImg("img"), addResto);
router.get("/resto/:id", getRestoId);
router.get("/resto/user/:id", getRestoUser);
router.get("/restos", getRestos);
router.get("/resto", userCheck, owner, getResto);
router.patch("/resto", userCheck, owner, uploadImg("img", true), editResto);
router.delete("/resto", userCheck, owner, deleteResto);

// transaction
// TODO: add transaction , get transactions, get transactions of id , get transaction , delete transaction.
const {
  addTransaction,
  getTransactions,
  getTransactionsAdmin,
  getTransaction,
  editTransaction,
  deleteTransaction,
  // getTransactionUser,
  getTransactionActive,
  // getTransactionUserOrder,
  getTransactionIdle,
  getTransactionOngoin,
} = require("../controller/transactions");

router.post("/add/transaction", userCheck, addTransaction);
router.get("/transaction/ongoing", userCheck, getTransactionOngoin);
router.get("/transaction/active", userCheck, getTransactionActive);
router.get("/transactions", userCheck, getTransactions);
router.get("/transaction/idle", userCheck, getTransactionIdle);
router.get("/transactions/admin", userCheck, admin, getTransactionsAdmin);
router.get("/transactionby/:id", userCheck, getTransaction);
router.patch("/transaction/:id", userCheck, editTransaction);
router.delete("/transaction/:id", userCheck, deleteTransaction);

//order
const {
  addOrder,
  getOrders,
  getOrdersAdmin,
  getOrder,
  getOrderProduct,
  updateOrder,
  deletedOrder,
  orderCount,
  lessOrder,
} = require("../controller/order");

router.post("/add/order", userCheck, addOrder);
router.post("/less/order", userCheck, lessOrder);
router.get("/orders", userCheck, getOrders);
router.get("/order/count", userCheck, orderCount);
router.get("/orders/admin", userCheck, admin, getOrdersAdmin);
router.get("/order/:id", userCheck, getOrder);
router.get("/order/product/:id", getOrderProduct);
router.patch("/order/:id", userCheck, updateOrder);
router.delete("/order/:id", userCheck, deletedOrder);

// get near resto by user location
const { nearResto } = require("../controller/nearResto");

router.get("/nearResto", userCheck, nearResto);

module.exports = router;

// TODO:don't forget to del add on router
