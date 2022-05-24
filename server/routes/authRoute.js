const express = require("express");
const bodyParser = require("body-parser");
const fs = require('fs')
const MongoClient = require('mongodb').MongoClient;
const { json } = require("body-parser");
const { map } = require("bluebird");
const router = express.Router();
const { v4: uuidv4 } = require('uuid')


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

MongoClient.connect(process.env.MONGODB_STRING_TWO, function(err, client) {
    if (err) throw err

    var db = client.db('bmi')
    var usersCollection = db.collection('users')

    router.route("/users").post((req, res, next) => {
        let email = req.body.email

        let message = {}
        usersCollection.findOne({
            'email': email
        }, function (err, result) {
            console.log(result)
            if (err) throw err

            if (result) {
                message = {
                    status: '200',
                    ...result
                }
                return res.send(message)
            } else {
                message = {
                    status: '404',
                    ...result
                }
                return res.send(message)
            }
        })
        return {
            "response": "response"
        }
    })

    router.route('/register').post((req, res, next) => {
        let serialNumber = uuidv4()
        let message = {}
        let email = req.body.email

        usersCollection.insertOne({
            'serialNumber': serialNumber,
            'email': email
        }, function(err, result) {
            if (err) throw err
            message = {
                status: '200',
                serialNumber: serialNumber,
                ...result
            }
            return res.send(message)
        })
    })
})


module.exports = router;