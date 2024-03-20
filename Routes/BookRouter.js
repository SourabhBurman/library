const express = require('express');
const { BookModel } = require('../Model/BookModel');

const bookRouter = express.Router();

bookRouter.get('/',async (req,res)=> {
    try{
      const allBooks = await BookModel.find();
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

bookRouter.post('/',async (req,res)=> {
    const { title, author, category, price, quantity} = req.body;
    try{
      const newBook = new BookModel({title, author, category, price, quantity})
      await newBook.save();
      res.status(201).send({msg:"new book added",newBook})
    } catch(err) {
        res.status(400).send({err})
    }
})

bookRouter.patch('/:bookId',async (req,res)=> {
    const update = req.body;
    const {bookId} = req.params;
    try{
      const updatedBook = await BookModel.findByIdAndUpdate({_id:bookId},update);
      res.status(201).send({msg:"book updated",updatedBook})
    } catch(err) {
        res.status(400).send({err})
    }
})

bookRouter.delete('/:bookId',async (req,res)=> {
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