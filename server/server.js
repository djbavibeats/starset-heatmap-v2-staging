const path = require("path");
const http = require("http");
const bodyParser = require('body-parser');
const express = require("express");
const socketIO = require("socket.io");
const MongoClient = require('mongodb').MongoClient; 
require('dotenv').config()

const  router  =  express.Router();

const coordinatesRouter = require("./routes/coordinatesRoutes");
const mailchimpRouter = require("./routes/mailchimpRoutes");
const authRoute = require("./routes/authRoute");
const cityRouter = require("./routes/cityRoute")

const publicPath = path.join(__dirname, "/../public");
const port = process.env.PORT || 4000;
let app = express();
let server = http.createServer(app);
let io = socketIO(server);

var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

  // intercept OPTIONS method
  if ('OPTIONS' == req.method) {
    res.send(200);
  }
  else {
    next();
  }
};

app.use(express.static(publicPath))
app.use(allowCrossDomain);

//bodyparser middleware
app.use(bodyParser.json());

//routes
app.use("/coordinates", coordinatesRouter);
app.use("/mailchimp", mailchimpRouter);
app.use("/auth", authRoute);
app.use("/current-city", cityRouter);

app.set('forceSSLOptions', {
  enable301Redirects: true,
  trustXFPHeader: false,
  httpsPort: 443,
  sslRequiredMessage: 'SSL Required.'
});


MongoClient.connect(process.env.MONGODB_STRING, function (err, client) {
  if (err) throw err

  var db = client.db('rebels')
  const coordinatesCollection = db.collection('rebels');

  db.collection('coordinates').find().toArray(function (err, result) {
    if (err) throw err

  })
  
  io.on("connection", (socket) => {
      console.log("new user connection", socket.handshake.query);

      socket.on("storeCoordinates", (coordinates) => {
          coordinatesCollection.insertOne({
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [coordinates.longitude, coordinates.latitude]
              }
            })
       
      })
  
      socket.on("disconnect", () => {
          console.log("user was disconnected")
      })
  })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}`);
})

