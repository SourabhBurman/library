const mongoose = require("mongoose");

const BookSchema = mongoose.Schema({
        title: String,
        author: String,
        category: String,
        price: Number,
        quantity: Number
},{
    versionKey : false
})

const BookModel = mongoose.model('books',BookSchema)

module.exports = { BookModel }