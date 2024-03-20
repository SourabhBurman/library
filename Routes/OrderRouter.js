const express = require('express');
const { OrderModel } = require('../Model/OrderModel');
const { authentication } = require('../Middleware/authentication');
const { authorization } = require('../Middleware/authorization');

const orderRouter = express.Router();

orderRouter.get('/orders',authentication,async(req,res)=> {
    try{
      const allOrders = await OrderModel.find().populate("user books");
      res.status(201).send({msg:"list of all orders",allOrders});
    } catch(error) {
        res.status(400).send({error});
    }
})

orderRouter.post('/order',authentication,async(req,res)=> {
    const user = req.user;
    const {books,totalAmount} = req.body;
    try{
        
        // let orders = await OrderModel.findOne({user: user._id})
        // if(!orders) {
        //     orders = await OrderModel.create({
        //         user : user._id
        //      })
        // }
        // console.log(orders);
        // orders.books.push(books);
        // await orders.save();
        let orders = new OrderModel({user:user._id,books,totalAmount})
        await orders.save();

      res.status(201).send({msg:"ordered successfull",orders});
    } catch(error) {
        res.status(400).send({error});
    }
})

module.exports = {orderRouter}