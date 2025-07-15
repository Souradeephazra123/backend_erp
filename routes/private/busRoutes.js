const express = require("express");
const router = express.Router();

const {
  createBusRoute,
  getBusRoutes,
  createFeeCollection,
  getFeeCollection,
  getStudentsByRoute,
  getTransactionsByStudentId,
} = require("../../controller/private/busfee");

// Routes for bus_route
router.post("/bus-routes", createBusRoute);
router.get("/bus-routes", getBusRoutes);

// Routes for bus_route_fee_collection
router.post("/fee-collection", createFeeCollection);
router.get("/fee-collection/:id", getFeeCollection);

// Routes for fetching students by route

router.get("/students", getStudentsByRoute);
router.get("/transactions", getTransactionsByStudentId);

module.exports = router;
