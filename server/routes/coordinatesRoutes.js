const express = require("express");
const bodyParser = require("body-parser");
const fs = require('fs')
const MongoClient = require('mongodb').MongoClient;
const { json } = require("body-parser");
const { map } = require("bluebird");
const router = express.Router();

MongoClient.connect('mongodb+srv://justin:Aoc!8314@cluster0.hi3xc.mongodb.net', function (err, client) {
    
    var db = client.db('starset')
    console.log("New DB Connection")
    db.collection('coordinates').find().toArray(function (err, result) {
        if (err) throw err
    
        console.log(result)
      })
    router.route("/").get((req, res, next) => {
        res.set('Content-Type', 'application/json');
        // res.send('{"message":"Hello froam the custom server!"}');
        // res.json({ "hello": "Man" })
        db.collection('coordinates').find().toArray()
        .then(results => {
            // console.log("Results", results);
            let jsonResults = JSON.stringify(results);
            fs.writeFile('./coordinates.geojson', jsonResults, err => {
                if (err) {
                  console.error(err)
                  return
                }
                //file written successfully
              })
            return res.json({ jsonResults });
        })
        .catch(error => console.error(error))
    })

    router.route("/get").get((req, res, next) => {
        db.collection('coordinates').find().toArray()
        .then(results => {
            let json = results[0];
            delete json["_id"]
            results.map((result) => {
                console.log(result);
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
            console.log(dataString);
            return res.send(dataString)
        })
    })
});

module.exports = router;