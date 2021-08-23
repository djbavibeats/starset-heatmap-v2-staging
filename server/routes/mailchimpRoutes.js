const express = require("express");
const bodyParser = require("body-parser");
const { json } = require("body-parser");
const { map } = require("bluebird");
const MailchimpClient = require("@mailchimp/mailchimp_marketing");
const crypto = require('crypto')
const fetch = require('node-fetch');

const router = express.Router();

MailchimpClient.setConfig({
    apiKey: process.env.MAILCHIMP_API_KEY,
    server: process.env.MAILCHIMP_SERVER_PREFIX
  });
  
router.route("/add-member").post((req, res, next) => {
    res.set('Content-Type', 'application/json');
    console.log("Request", req.body);
    MailchimpClient.lists.addListMember("a753b0ac3d", {
          email_address: req.body.email,
          status: "subscribed",
          tags: req.body.dsp
    }).then(result => {
        console.log(result)
        return res.send(result)
    })
    .catch(err => console.log(err));

})

router.route("/check-member").post((req, res, next) => {
    res.set('Content-Type', 'application/json');
    return MailchimpClient.lists.getListMembersInfo("a753b0ac3d")
        .then(resp => {
            return res.send(resp)
        })
    .catch(err => console.log(err));
})

router.route("/update-member").post(async (req, res, next) => {
    
    let hash = crypto.createHash('md5').update(req.body.email).digest("hex");
    console.log(req.body.dsp);

    var raw = JSON.stringify({
        "tags": [
          {
            "name": `${req.body.dsp}`,
            "status": "active"
          }
        ]
      });

    var requestOptions = {
        method: 'POST',
        headers: {
            "Authorization": `Basic ${process.env.BEARER_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: raw,
        redirect: 'follow'
    };
      

    fetch(`https://us1.api.mailchimp.com/3.0/lists/a753b0ac3d/members/${hash}/tags`, requestOptions)
        .then(response => response.text())
        .then(result => { 
            console.log("Result", result)
            return res.send(result);
        })
    .catch(error => console.log('error', error));
    
})

module.exports = router;