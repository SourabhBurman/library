const jwt = require('jsonwebtoken');
const { UserModel } = require('../Model/UserModel');

const authorization = async (req,res,next) => {
    try{
         const user = req.user;
         if(user.isAdmin) {
            next();
         } else {
            res.status(400).send({msg:"user not authorized"})
         }
    } catch(error) {
        res.status(400).send({error})
    }
    
}

module.exports = {authorization}