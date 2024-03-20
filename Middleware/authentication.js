const jwt = require('jsonwebtoken');
const { UserModel } = require('../Model/UserModel');

const authentication = async (req,res,next) => {
    try{
        const token = req.headers.authorization?.split(" ")[1];

        if(token) {
            const decoded = jwt.verify(token, 'secret');
            if(decoded) {
                const user = await UserModel.findOne({_id:decoded.userId})
                req.user = user
                  next();
            }
        } else {
            res.status(400).send({msg:"not authenticated"})
        }
    } catch(error) {
        res.status(400).send({error})
    }
    
}

module.exports = {authentication}