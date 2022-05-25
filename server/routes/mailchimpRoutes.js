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

    // MailchimpClient.lists.addListMember("16effdaabd", {
    MailchimpClient.lists.addListMember("6ad68f1bc1", {
          email_address: req.body.email,
          status: "subscribed",
          tags: [ req.body.tag ]
    }).then(result => {
        console.log(result)
        return res.send(result)
    })
    .catch(err => {
        console.log(err)
        return res.send(err);
    });

})

router.route("/check-member").post((req, res, next) => {
    res.set('Content-Type', 'application/json');
    return MailchimpClient.lists.getListMembersInfo("6ad68f1bc1")
        .then(resp => {
            return res.send(resp)
        })
    .catch(err => console.log(err));
})

router.route("/update-member").post(async (req, res, next) => {
    
    let hash = crypto.createHash('md5').update(req.body.email).digest("hex");

    var raw = JSON.stringify({
        "tags": [
          {
            "name": `${req.body.tag}`,
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
      
    // fetch(`https://us7.api.mailchimp.com/3.0/lists/16effdaabd/members/${hash}/tags`, requestOptions)
    fetch(`https://us7.api.mailchimp.com/3.0/lists/6ad68f1bc1/members/${hash}/tags`, requestOptions)
        .then(response => response.text())
        .then(result => { 
            return res.send(result);
        })
    .catch(error => console.log('error', error));
    
})

module.exports = router;