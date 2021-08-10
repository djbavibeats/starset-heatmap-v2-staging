let socket = io();
var x = document.getElementById("ip");
let latitude;
let longitude;

socket.on("connect", function () {
    console.log("connected to server")
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
            console.log(latitude, longitude)
            socket.emit("createMessage", {
                "x": latitude,
                "y": longitude
            })
        });
    } else { 
        x.innerHTML = "Geolocation is not supported by this browser.";
    }
    
})

socket.on("disconnect", function () {
    console.log("disconnected from server")
})