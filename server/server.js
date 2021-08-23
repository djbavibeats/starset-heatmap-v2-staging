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

const publicPath = path.join(__dirname, "/../public");
const port = process.env.PORT || 3000;
let app = express();
let server = http.createServer(app);
let io = socketIO(server);

app.use(express.static(publicPath))

//bodyparser middleware
app.use(bodyParser.json());

//routes
app.use("/coordinates", coordinatesRouter);
app.use("/mailchimp", mailchimpRouter)



MongoClient.connect(process.env.MONGODB_STRING, function (err, client) {
  if (err) throw err

  var db = client.db('starset')
  const coordinatesCollection = db.collection('coordinates');

  db.collection('coordinates').find().toArray(function (err, result) {
    if (err) throw err

    console.log(result)
  })
  
  io.on("connection", (socket) => {
      console.log("new user connection");
      socket.on("storeCoordinates", (coordinates) => {
          // coordinatesCollection.insertOne({
          //     "type": "Feature",
          //     "geometry": {
          //       "type": "Point",
          //       "coordinates": [coordinates.longitude, coordinates.latitude]
          //     }
          //   })
      })
  
      socket.on("disconnect", () => {
          console.log("user was disconnected")
      })
  })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}`);
})