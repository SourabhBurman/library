const express = require('express');
const { OrderModel } = require('../Model/OrderModel');

const orderRouter = express.Router();

orderRouter.get('/orders',async(req,res)=> {
    try{
      const allOrders = await OrderModel.find();
      res.status(201).send({msg:"list of all orders",allOrders});
    } catch(error) {
        res.status(400).send({error});
    }
})

// orderRouter.post('/order',async(req,res)=> {
//     try{
//       const allOrders = await OrderModel.find();
//       res.status(201).send({msg:"list of all orders",allOrders});
//     } catch(error) {
//         res.status(400).send({error});
//     }
// })

module.exports = {orderRouter}