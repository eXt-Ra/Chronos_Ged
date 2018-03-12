const mongoose = require("mongoose");

module.exports = () => {
    mongoose.connect("mongodb://172.18.17.7:27017/Ged", err => {
        if (err){
            console.log(err);
        }else{
            console.log("Mongo is connect")
        }
    });
};


