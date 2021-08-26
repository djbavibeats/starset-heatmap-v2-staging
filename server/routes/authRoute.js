const express = require("express");
const bodyParser = require("body-parser");
const fs = require('fs')
const MongoClient = require('mongodb').MongoClient;
const { json } = require("body-parser");
const { map } = require("bluebird");
const router = express.Router();

router.route("/").post((req, res, next) => {
    res.set('Content-Type', 'application/json');
    console.log(req.body.pass);
    let response = {
        "STATUS": "",
        "MESSAGE": ""
    }
    if (req.body.pass === process.env.SITE_PASSWORD) {
        response.STATUS = "200",
        response.MESSAGE = "SUCCESS"
    } else {
        response.STATUS = "400",
        response.MESSAGE = "ACCESS DENIED"
    }
    res.send(response)
})


module.exports = router;