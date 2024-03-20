const express = require('express');
const { BookModel } = require('../Model/BookModel');
const { authorization } = require('../Middleware/authorization');
const { authentication } = require('../Middleware/authentication');

const bookRouter = express.Router();

bookRouter.get('/',async (req,res)=> {
    const givenQuery = req.query;
    console.log(givenQuery);
    const myQuery = {};
    if(givenQuery.category) {
        myQuery.category = givenQuery.category
    }
    if(givenQuery.author) {
        myQuery.author = givenQuery.author
    }
    try{
      const allBooks = await BookModel.find(myQuery);
      res.status(200).send({msg:"list of all books",allBooks})
    } catch(err) {
        res.status(400).send({err})
    }
})

bookRouter.get('/:bookId',async (req,res)=> {
    const {bookId} = req.params;
    try{
      const book = await BookModel.find({_id:bookId});
      res.status(200).send({book})
    } catch(err) {
        res.status(400).send({err})
    }
})

bookRouter.post('/',authentication,authorization,async (req,res)=> {
    const { title, author, category, price, quantity} = req.body;
    try{
      const newBook = new BookModel({title, author, category, price, quantity})
      await newBook.save();
      res.status(201).send({msg:"new book added",newBook})
    } catch(err) {
        res.status(400).send({err})
    }
})

bookRouter.patch('/:bookId',authentication,authorization,async (req,res)=> {
    const update = req.body;
    const {bookId} = req.params;
    try{
      const updatedBook = await BookModel.findByIdAndUpdate({_id:bookId},update);
      res.status(201).send({msg:"book updated"})
    } catch(err) {
        res.status(400).send({err})
    }
})

bookRouter.delete('/:bookId',authentication,authorization,async (req,res)=> {
    const update = req.body;
    const {bookId} = req.params;
    try{
      const deletedBook = await BookModel.findByIdAndDeletee({_id:bookId});
      res.status(201).send({msg:"book deleted",deletedBook})
    } catch(err) {
        res.status(400).send({err})
    }
})


module.exports = { bookRouter }