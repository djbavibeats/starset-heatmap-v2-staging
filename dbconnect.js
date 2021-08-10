  
const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");

const url = "mongodb+srv://justin:Aoc!8314@cluster0.hi3xc.mongodb.net";

const connect = mongoose.connect(url, { useNewUrlParser: true });

module.exports = connect;