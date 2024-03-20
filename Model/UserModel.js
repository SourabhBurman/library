const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
    name: {type : String, required : true},
    email: {type : String, required : true},
    password: {type : String, required : true},
    isAdmin: {type : Boolean, enum:[true,false], default : false},
},{
    versionKey : false
})

const UserModel = mongoose.model('users',UserSchema)

module.exports = { UserModel }