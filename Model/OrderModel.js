const mongoose = require("mongoose");

const OrderSchema = mongoose.Schema({
    user : { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    books : [{ type: mongoose.Schema.Types.ObjectId, ref: 'books' }],
    totalAmount: Number
},{
    versionKey : false
})

const OrderModel = mongoose.model('orders',OrderSchema)

module.exports = { OrderModel }