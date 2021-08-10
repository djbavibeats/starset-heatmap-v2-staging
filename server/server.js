const path = require("path");
const http = require("http");
const express = require("express");
const socketIO = require("socket.io");

const publicPath = path.join(__dirname, "/../public");
const port = process.env.PORT || 3000;
let app = express();
let server = http.createServer(app);
let io = socketIO(server);

app.use(express.static(publicPath));

io.on("connection", (socket) => {
    console.log("new user connection")

    socket.on('marker:create', function (data) {
        console.log(data.type, data.lat, data.lon);
        io.sockets.emit('call', {markers: [{type: data.type, lat: data.lat, lon: data.lon}]});
    });

    socket.on("disconnect", () => {
        console.log("user was disconnected")
    })
})



server.listen(port, () => {
    console.log(`Server is up on port ${port}`);
})