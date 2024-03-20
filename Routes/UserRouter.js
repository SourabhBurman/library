const express = require('express');
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken');
const { UserModel } = require('../Model/UserModel');

const userRouter = express.Router();


userRouter.post('/register', async (req,res)=> {

    const { name, email, password, isAdmin} = req.body;
    try{
         const doExist = await UserModel.findOne({email});
         if(doExist) {
             return res.status(400).send({msg:"User Already exists"})
         } else {
            const hash = bcrypt.hashSync(password, 5);
            const newUser = new UserModel({name,email,password:hash,isAdmin});
            await newUser.save();
            res.status(201).send({msg:"user successfully registerd",newUser})
         }
    } catch(err) {
        res.status(400).send({err})
    }
})

userRouter.post('/login', async (req,res)=> {

    const { email, password } = req.body;
    try{
         const user = await UserModel.findOne({email});
         if(!user) {
            res.status(400).send({msg:"User doesn't exists"})
         } else {
             const check = bcrypt.compareSync(password, user.password);
           if(check) {
                 const token = jwt.sign({userId: user._id}, 'secret', { expiresIn: '1h' });
                res.status(201).send({msg:"Login Successfull",token})
           } else {
            res.status(400).send({msg:"Invalid credentails"})
           }
         }
    } catch(err) {
        res.status(400).send({err})
    }
})

module.exports = { userRouter }