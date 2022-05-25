const express = require("express");
const bodyParser = require("body-parser");
const fs = require('fs')
const MongoClient = require('mongodb').MongoClient;
const { json } = require("body-parser");
const { map } = require("bluebird");
const router = express.Router();

MongoClient.connect(process.env.MONGODB_STRING, function (err, client) {
    var db = client.db('rebels')
    console.log("New DB Connection")
    // Get Second Collection of Rebels
    // db.collection('rebelsTwo').find().toArray(function (err, result) {
    //     if (err) throw err
    
    //     // console.log(result)
    // })

    // router.route("/").get((req, res, next) => {
    //     res.set('Content-Type', 'application/json');
    //     db.collection('rebelsTwo').find().toArray()
    //     .then(results => {
    //         let jsonResults = JSON.stringify(results);
            
    //         return res.json({ jsonResults });
    //     })
    //     .catch(error => console.error(error))
    // })


    router.route("/").get((req, res, next) => {
        db.collection('rebels').find().toArray()
            .then(results => {
                let json = results[0];
                delete json["_id"]
                results.map((result) => {
                    // console.log(result);
                    delete result["_id"]
                })
                dataArray = results.map(function(e){
                    return JSON.stringify(e);
                });
                
                dataString = `{
                    "type":"FeatureCollection",
                    "features":[` + 
                        dataArray.join(",") 
                    + `]
                }`
                return res.send(dataString)
            })
    })
});

module.exports = router;