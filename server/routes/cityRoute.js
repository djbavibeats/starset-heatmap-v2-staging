const express = require("express");
const router = express.Router();

router.route("/").get((req, res, next) => {
    console.log(process.env.CURRENT_CITY)
    let response = {
        'city': process.env.CURRENT_CITY
    }
    return res.send(response)
})


module.exports = router;