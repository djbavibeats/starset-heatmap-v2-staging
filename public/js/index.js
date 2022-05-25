
let socket = io();

let tourDates
let userCity
let cityToPlot
let latitudeToPlot
let longitudeToPlot

fetch("./js/tourDates.json")
    .then(res => res.json())
    .then(data => {
        tourDates = data.tourDates
    })
    
function getLocation() {
    var urlParams
    (window.onpopstate = function () {
        var match,
            pl     = /\+/g,  // Regex for replacing addition symbol with a space
            search = /([^&=]+)=?([^&]*)/g,
            decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); }
            query  = window.location.search.substring(1)
    
        urlParams = {}
        while (match = search.exec(query))
        urlParams[decode(match[1])] = decode(match[2])
    })()

    userCity = urlParams.base || 'root'

    return fetch('/current-city', {
        method: 'GET'
    }).then(resp => {
        resp.json().then(data => {
            tourDates.map((date) => {
                if (date.city === data.city) {
                    cityToPlot = date.city
                    venueToPlot = date.venue
                    latitudeToPlot = date.latitude
                    longitudeToPlot = date.longitude

                    return new Promise((resolve, reject) => {  
                        socket.emit('storeCoordinates', { 
                            latitude: latitudeToPlot, 
                            longitude: longitudeToPlot
                        })
                        resolve()
                    })
                }
            })
        })
    })
    

}

$('#bgvid').on('loadeddata', function() {   
    getLocation().then(() => {
        renderMap().then(() => {
            if (!getCookie("email_signup")) {
                checkEmail()
                    .then(() => {
                        loadStreaming(dsp);
                        document.getElementById('loading').style.opacity = 0
                        document.getElementById("map").style.visibility = 'visible'
                        setTimeout(function(){ 
                            document.getElementById('loading').style.display = 'none'
                        }, 500)
                    })
            } else {
                document.getElementById('loading').style.opacity = 0
                setTimeout(function(){ document.getElementById('loading').style.display = 'none'; }, 500)
                document.getElementById("modal").style.display = 'flex'                            
            }
        })
    })      
})

let userEmail = "";

function checkEmail() {
    return new Promise((resolve, reject) => {
        userEmail = getCookie("email_signup")
        resolve()
    })
} 

var map = '';
var flying = true;

function renderMap() {
    var x = document.getElementById("ip");
    
    mapboxgl.accessToken = 'pk.eyJ1Ijoidm9sdGNyZWF0aXZlIiwiYSI6ImNrc2o3Nm5xczJhcWYydm52dWZiNnFjYjYifQ.wiFR3wiw_OAAVayRRaChwA';
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/voltcreative/cksj7g9s0aen218rm63nhnyf2',
        zoom: 3.5,
        center: [-95.7129,37.0902]
    });
    
    return new Promise((resolve, reject) => {
        const url = '/coordinates';
        map.on('load', () => {
            fetch(url, { method: 'GET' })
                .then(resp => resp.json())
                .then(data => {
                    map.getSource('BMIS').setData(data)
                    resolve()
                })
                
                map.addSource('BMIS', { type: 'geojson', data: url });   
                map.addLayer({
                    'id': 'trees-heat',
                    'type': 'heatmap',
                    'source': 'BMIS',
                    'maxzoom': 15,
                    'paint': {
                        'heatmap-color': 
                        [
                            "interpolate",
                            ["linear"],
                            ["heatmap-density"],
                            0, 'rgba(25, 0, 225, 0)',
                            .05, 'rgba(25, 0, 225, 1)',
                            .075, 'rgba(25, 0, 225, 0)',
                            1, 'rgba(25, 0, 225, 1)'
                        ],
                        'heatmap-weight': [
                            'interpolate',
                            ['linear'],
                            ['get', 'mag'],
                            0, 1
                        ]
    
                    }
                        
                }, 'waterway-label')
            
          
           
            let currentDate = new Date()
            let pastTourDates = []
            tourDates.map(tourDate => {
                if (new Date(tourDate.date) < currentDate) {
                    pastTourDates.push([ tourDate.longitude, tourDate.latitude ])
                }
            })
            map.addSource('BMIS-LINE', { type: 'geojson', 'data': {
                'type': 'Feature',
                'properties': {},
                'geometry': {
                    'type': 'LineString',
                    'coordinates': pastTourDates
                }
            }})
            map.addLayer({
                'id': 'trees-line',
                'type': 'line',
                'source': 'BMIS-LINE',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': 'rgba(25, 0, 225, 1)',
                    'line-width': 4
                }
            }, 'waterway-label')                       
        })
    });
}

let isAtStart = true;

function hideModal() {
    document.getElementById("modal").style.opacity = 0
    document.getElementById("modal").style.visibility = 'hidden'
    document.getElementById("bgvid").style.opacity = 0
    document.getElementById("bgvid").style.display = 'none'
    document.getElementById("map").style.visibility = 'visible'
}

function generateID(email) {
    let info = {
        email: email
    }
    let serialNumber = ""
    return fetch('/auth/register', {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(info)
    }).then(response => response.json().then(data => {
        serialNumber = data.serialNumber
        let responseMessage = `Thank you for registering. Your BMI Serial Number is #${serialNumber}, please take a screenshot of this for ease of access. Enjoy the demonstration.`
        let closeModalButton = `<button class="close-modal-button" onclick="hideModal();">Close Modal</button>`
        document.getElementById('responseMessage').innerHTML = `<div style="margin: 0 auto;">
            <p>${responseMessage}</p>
            ${closeModalButton}
        </div>`
    }))
}

function checkBMIStatus(info) {
    // Check if user has a BMI Serial Number
    return fetch('/auth/users', {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(info)
    }).then(response => {
        let responseMessage = ""
        let registerButton = ""
        let closeModalButton = `<button class="close-modal-button" onclick="hideModal();">Close Modal</button>`
        return response.json().then(userData => {
            // User has already registered their serial number
            if (userData.status === '200') {
                responseMessage = `Welcome back BMI #${userData.serialNumber}, we're glad you were able to make it to this evening's demonstration.`
                document.getElementById('responseMessage').innerHTML = `<div style="margin: 0 auto;">
                    <p>${responseMessage}</p>
                    ${closeModalButton}
                </div>`
                document.querySelector('.email-signup-button').style.display = 'none'
                document.querySelector('.email-signup-input').style.display = 'none'
                document.querySelector('.email-signup-text').style.display = 'none'
            
            // User has not registered their serial number
            } else if (userData.status === '404') {
                responseMessage = `We're glad you were able to make it to this evening's demonstration.<br /><br /> It looks like you have not yet registered your BMI device. Would you like to do that now?`
                registerButton = `<button class="register-button" onclick="generateID('` + info.email + `');">Register</button>`
                document.getElementById('responseMessage').innerHTML = `<div>
                    <p>${responseMessage}</p>
                    <div class="register-close-wrapper">
                    ${registerButton}
                    ${closeModalButton}
                    </div>
                </div>`
                document.querySelector('.email-signup-button').style.display = 'none'
                document.querySelector('.email-signup-input').style.display = 'none'
                document.querySelector('.email-signup-text').style.display = 'none'
            }
        })
    })
}

function submitForm() {
    let email = document.getElementById('email').value;
    
    document.cookie = `email_signup=${email}`;

    // Regex check for valid email format
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        let info = {
            email: email,
            tag: 'devolution'
        }
            // Attempt to add user to Mailchimp 
            return fetch('/mailchimp/add-member', {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache', 
                headers: {
                'Content-Type': 'application/json'
                },
                body: JSON.stringify(info)
            }).then(response => {
                return response.json().then(data => {
                    // If user is already in Mailchimp, update them instead
                    if (data.status == 400) {
                        return fetch('/mailchimp/update-member', {
                            method: 'POST',
                            mode: 'cors',
                            cache: 'no-cache',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(info)
                        }).then(response => {
                            checkBMIStatus(info)
                        })
                    // If user is not in Mailchimp, skip update and proceed to BMI update
                    } else {
                        checkBMIStatus(info)
                    }
                })
            })
    } else {
        alert("You have entered an invalid email address!")
        return false;
    }
}

function loadStreaming(platformName) {
    switch(platformName) {
        case('spotify'):
            document.getElementById("dsp").innerHTML = `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/album/0tJI0EBOHEcxov6V1ddIo7?utm_source=generator&theme=0" width="100%" height="80" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>`
            break;
        case('apple'):
            if (window.innerWidth <= 768) {
                document.getElementById("map").style.height = "calc(100vh - 190px)"
            }
            document.getElementById("dsp").innerHTML = `<iframe src="https://embed.music.apple.com/us/album/infected/1565419032?i=1565419042&amp;app=music&amp;itsct=music_box_player&amp;itscg=30200&amp;ct=songs_infected&amp;ls=1" height="140px" frameborder="0" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation" allow="autoplay *; encrypted-media *;" style="width: 100%; overflow: hidden; border-radius: 0px;"></iframe>` 
            break;
        case('tidal'):
            document.getElementById("dsp").innerHTML = `<div style="left: 0; width: 100%; height: 150px; position: relative;"><iframe src="https://embed.tidal.com/albums/182411161" style="top: 0; left: 0; width: 100%; height: 80px; position: absolute; border: 0;" allowfullscreen allow="encrypted-media;"></iframe></div>` 
            break;
        default:
            document.getElementById("dsp").innerHTML = `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/album/0tJI0EBOHEcxov6V1ddIo7?utm_source=generator&theme=0" width="100%" height="80" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>`
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
// $(window).resize(function() {
//     if( /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
//         if (window.matchMedia("(orientation: portrait)").matches) {
//             // you're in PORTRAIT mode
//             $('#mobile-instructions').css({
//                 'position': 'absolute',
//                 'width': '100%',
//                 'height': '100vh',
//                 'top': '0',
//                 'z-index': '10',
//                 'display': 'flex'
//             })
//         }

//         if (window.matchMedia("(orientation: landscape)").matches) {
//             // you're in LANDSCAPE mode
//             $('#mobile-instructions').css({
//                 'display' : 'none'
//             })
//         }

//     }
// }).resize();

window.onclick = function(event) {
    var socialModalWrapper = document.getElementById('social-modal-wrapper');
    if (event.target == socialModalWrapper) {
        socialModalWrapper.style.display = "none";
    }
}