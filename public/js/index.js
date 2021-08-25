let latitude = 39;
let longitude = -82;
let socket = io();

function getLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position, showError) => {
                    latitude = position.coords.latitude;
                    longitude = position.coords.longitude;
                    socket.emit('storeCoordinates', { 
                        latitude: latitude, 
                        longitude: longitude 
                    });
                    
                    resolve();
                })
        } else {
            alert("Please enable location")
        }
    })
}

function showError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            alert("User denied the request for Geolocation.")
            break;
        case error.POSITION_UNAVAILABLE:
            alert("Location information is unavailable.")
            break;
        case error.TIMEOUT:
            alert("The request to get user location timed out.")
            break;
        case error.UNKNOWN_ERROR:
            alert("An unknown error occurred.")
            break;
    }
}

$('#bgvid').on('loadeddata', function() {         
    getLocation().then(() => {
        renderMap().then(() => {
            if (getCookie("email_signup")) {
                checkEmail()
                    .then(() => {
                        loadStreaming(dsp);
                        document.getElementById('loading').style.opacity = 0;
                        document.getElementById("map").style.visibility = 'visible';
                        setTimeout(function(){ 
                            document.getElementById('loading').style.display = 'none'; 
                            zoomMap();
                        }, 500)
                    })
            } else {
                document.getElementById('loading').style.opacity = 0;
                setTimeout(function(){ document.getElementById('loading').style.display = 'none'; }, 500);
                document.getElementById("modal").style.display = 'flex';
                document.getElementById("bgvid").style.display = 'block';                               
            }
        })
    }) 
})

let dsp = "";
let userEmail = "";

function checkEmail() {
    userEmail = getCookie("email_signup");
    return new Promise((resolve, reject) => {
        fetch('http://localhost:3000/mailchimp/check-member', {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: userEmail
            })
        }).then(resp => {
            return resp.json();
        }).then(data => {
            var result = data.members.filter(x => x.email_address === userEmail);
            dsp = result[0].tags[0].name;
            resolve();
        });
    });
    
} 

var map = '';
var flying = true;

function renderMap() {
    var x = document.getElementById("ip");
    
    mapboxgl.accessToken = 'pk.eyJ1Ijoidm9sdGNyZWF0aXZlIiwiYSI6ImNrc2o3Nm5xczJhcWYydm52dWZiNnFjYjYifQ.wiFR3wiw_OAAVayRRaChwA';
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/voltcreative/cksj7g9s0aen218rm63nhnyf2',
        zoom: 1,
        center: [0, 0]
    });
    
    return new Promise((resolve, reject) => {
        const url = 'http://localhost:3000/coordinates/get';
        map.on('load', () => {
            fetch(url, { method: 'GET' })
                .then(resp => resp.json())
                .then(data => {
                    map.getSource('BMIS').setData(data)
                    resolve();
                });
            map.addSource('BMIS', { type: 'geojson', data: url });
            map.addLayer(
                {
                    'id': 'trees-heat',
                    'type': 'heatmap',
                    'source': 'BMIS',
                    'maxzoom': 15,
                    'paint': {
                        'heatmap-color': [
                            "interpolate",
                            ["linear"],
                            ["heatmap-density"],
                            0, "rgba(0, 0, 255, 0)",
                            .3, '#1226ab',
                            .4, '#655dc6',
                            1, '#ffffff'
                        ],
                        'heatmap-weight': [
                            'interpolate',
                            ['linear'],
                            ['get', 'mag'],
                            0, 1, 30, 50
                        ]

                    }
                    
                }, 'waterway-label');
            map.addLayer(
                {
                    'id': 'trees-point',
                    'type': 'circle',
                    'source': 'BMIS',
                    'minzoom': 14,
                    'paint': {
                        'circle-radius': {
                            'property': 'dbh',
                            'type': 'exponential',
                            'stops': [
                                [{ zoom: 15, value: 1 }, 5],
                                [{ zoom: 15, value: 62 }, 10],
                                [{ zoom: 22, value: 1 }, 20],
                                [{ zoom: 22, value: 62 }, 50]
                            ]
                        },
                        'circle-color': {
                            'property': 'dbh',
                            'type': 'exponential',
                            'stops': [
                                [0, 'rgba(236,222,239,0)'],
                                [10, 'rgb(236,222,239)'],
                                [20, 'rgb(208,209,230)'],
                                [30, 'rgb(166,189,219)'],
                                [40, 'rgb(103,169,207)'],
                                [50, 'rgb(28,144,153)'],
                                [60, 'rgb(1,108,89)']
                            ]
                        },
                        'circle-stroke-color': 'white',
                        'circle-stroke-width': 1,
                        'circle-opacity': {
                            'stops': [
                                [14, 0],
                                [15, 1]
                            ]
                        }
                    }
            }, 'waterway-label');
            map.on('click', 'trees-point', function(e) {
                new mapboxgl.Popup()
                    .setLngLat(e.features[0].geometry.coordinates)
                    .setHTML(`<div id="video-content" style="background: black;">
                        <div></div>
                    </div>`)
                    .on('open', () => {
                        document.getElementById('video-content').innerHTML = `<div>
                            <img src="./bmi_located.gif" />
                            <button onclick="socialModal();">Share</button>
                        </div>`
                    })
                    .addTo(map)
            })                        
        })
    });
}

let isAtStart = true;

function socialModal() {
    $('#social-modal').css({
        'display': 'flex',
        'opacity': '1'
    })
}

function zoomMap() {
    const start = [0, 0];
    const end = [longitude, latitude];
    const target = isAtStart ? end : start;
    
    isAtStart = !isAtStart;
    
    map.once('moveend',()=>{
        showInstructions();
    })

    map.flyTo({
        center: target,
        zoom: 8,
        bearing: 0,
        speed: .5,
        curve: 1,
        easing: (t) => t,
        essential: true
    });
};

function showInstructions() {
    $('#instructions-popup').css({ 
        'visibility' : 'visible', 
        'font-size' : '40px',
        'position': 'absolute',
        'top': '0%',
        'width': '100%',
        'height': '100%'
    })
    $('#instructions-popup').animate({
        'opacity' : 1
    }, 2000, function() {
        $( window ).click(() => {
            $('#instructions-popup').animate({
            'opacity' : 0
            }, 2000, function() {
                $('#instructions-popup').css({
                    'display' : 'none'
                })
            })
        })
    })
}

function submitForm() {
    let email = document.getElementById('email').value;
    let dspSubmit = document.querySelector('input[name = "dsp"]:checked').value;
    
    document.cookie = `email_signup=${email}`;

    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        let info = {
            email: email,
            dsp: [ dspSubmit ]
        }
        fetch('http://localhost:3000/mailchimp/check-member', {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(info)
        }).then(response => response.json().then(data => {
            var result = data.members.filter(x => x.email_address === email);

            if (result.length) {
                return fetch('http://localhost:3000/mailchimp/update-member', {
                    method: 'POST',
                    mode: 'cors',
                    cache: 'no-cache',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(info)
                }).then(response => {
                    loadStreaming(dspSubmit);
                    document.getElementById("modal").style.opacity = 0;
                    document.getElementById("modal").style.display = 'none';
                    document.getElementById("bgvid").style.opacity = 0;
                    document.getElementById("bgvid").style.display = 'none';
                    document.getElementById("map").style.visibility = 'visible';
                    zoomMap();
                })
            } else {
                return fetch('http://localhost:3000/mailchimp/add-member', {
                    method: 'POST',
                    mode: 'cors',
                    cache: 'no-cache', 
                    headers: {
                    'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(info)
                }).then(response => {
                    loadStreaming(dspSubmit);
                    document.getElementById("modal").style.opacity = 0;
                    document.getElementById("modal").style.display = 'none';
                    document.getElementById("bgvid").style.opacity = 0;
                    document.getElementById("bgvid").style.display = 'none';
                    document.getElementById("map").style.visibility = 'visible';
                    zoomMap();
                })
            }
            return;
        }))
        return true;
    } else {
        alert("You have entered an invalid email address!")
        return false;
    }
}

function loadStreaming(platformName) {
    switch(platformName) {
        case('spotify'):
            document.getElementById("dsp").innerHTML = `<iframe src="https://open.spotify.com/embed/track/0KqSyyMHi1HADSaVz8suvI?theme=0" width="100%" height="150" frameBorder="0" allowtransparency="true" allow="encrypted-media"></iframe>`
            break;
        case('apple'):
            document.getElementById("dsp").innerHTML = `<iframe src="https://embed.music.apple.com/us/album/infected/1565419032?i=1565419042&amp;app=music&amp;itsct=music_box_player&amp;itscg=30200&amp;ct=songs_infected&amp;ls=1" height="150px" frameborder="0" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation" allow="autoplay *; encrypted-media *;" style="width: 100%; max-width: 660px; overflow: hidden; border-radius: 10px; background: transparent;"></iframe>` 
            break;
        case('tidal'):
            document.getElementById("dsp").innerHTML = `<div style="left: 0; width: 100%; height: 150px; position: relative;"><iframe src="https://embed.tidal.com/albums/182411161" style="top: 0; left: 0; width: 100%; height: 100%; position: absolute; border: 0;" allowfullscreen allow="encrypted-media;"></iframe></div>` 
            break;
        default:
            break;
    }
}

function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

// Check to see if device is accessing site on mobile
$(window).resize(function() {
    console.log("resize!");
    if( /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
        console.log("mobile")
        if (window.matchMedia("(orientation: portrait)").matches) {
            // you're in PORTRAIT mode
            console.log("portrait");
            $('#mobile-instructions').css({
                'position': 'absolute',
                'width': '100%',
                'height': '100vh',
                'top': '0',
                'z-index': '10',
                'display': 'flex'
            })
        }

        if (window.matchMedia("(orientation: landscape)").matches) {
            // you're in LANDSCAPE mode
            console.log("landscape")
            $('#mobile-instructions').css({
                'display' : 'none'
            })
        }

    } else {
        console.log("desktop")
    }
}).resize();