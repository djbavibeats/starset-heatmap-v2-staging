
let socket = io();

let tourDates
let userCity
let cityToPlot
let latitudeToPlot
let longitudeToPlot
let color

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

    tourDates.map((date) => {
        if (date.city === userCity) {
            cityToPlot = date.city
            venueToPlot = date.venue
            latitudeToPlot = date.latitude
            longitudeToPlot = date.longitude,
            color = date.color,
            variation = date.variation
        } else if (userCity === 'root') {
            cityToPlot = 'portland',
            venueToPlot = 'oregon',
            latitudeToPlot = '45.5232',
            longitudeToPlot = '-122.6763',
            color = 'rgba(225, 225, 225, 1)',
            variation = 'two'
        }
    })

    return new Promise((resolve, reject) => {  
        socket.emit('storeCoordinates', { 
            latitude: latitudeToPlot, 
            longitude: longitudeToPlot,
            color: color,
            variation: variation
        })
        resolve()
    })
}

$('#bgvid').on('loadeddata', function() {   
    getLocation().then(() => {
        renderMap().then(() => {
            if (getCookie("email_signup")) {
                checkEmail()
                    .then(() => {
                        loadStreaming(dsp);
                        document.getElementById('loading').style.opacity = 0
                        document.getElementById("map").style.visibility = 'visible'
                        setTimeout(function(){ 
                            document.getElementById('loading').style.display = 'none'
                            // zoomMap()
                        }, 500)
                    })
            } else {
                document.getElementById('loading').style.opacity = 0
                setTimeout(function(){ document.getElementById('loading').style.display = 'none'; }, 500)
                document.getElementById("modal").style.display = 'flex'
                document.getElementById("bgvid").style.display = 'block'                              
            }
        })
    })      
})

// function submitPassword() {
//     let pass = {
//         pass: `${document.getElementById("password").value}`
//     }
//     fetch("/auth", {
//         method: 'POST',
//         mode: 'cors',
//         cache: 'no-cache', 
//         headers: {
//         'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(pass)
//     }).then(resp => {
//         resp.json().then(data => { 
//             console.log(data.STATUS);
//             if (data.STATUS === "200") {
//                 console.log("YO")
//                 document.getElementById("content").innerHTML = entireFuckingSite;
//                 // Check to see if device is accessing site on mobile
//                 $(window).resize(function() {
//                     if( /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
//                         if (window.matchMedia("(orientation: portrait)").matches) {
//                             // you're in PORTRAIT mode
//                             $('#mobile-instructions').css({
//                                 'position': 'absolute',
//                                 'width': '100%',
//                                 'height': '100vh',
//                                 'top': '0',
//                                 'z-index': '10',
//                                 'display': 'flex'
//                             })
//                         }

//                         if (window.matchMedia("(orientation: landscape)").matches) {
//                             // you're in LANDSCAPE mode
//                             $('#mobile-instructions').css({
//                                 'display' : 'none'
//                             })
//                         }

//                     }
//                 }).resize();
//                 $('#bgvid').on('loadeddata', function() {         
//                     getLocation().then(() => {
//                         renderMap().then(() => {
//                             if (getCookie("email_signup")) {
//                                 checkEmail()
//                                     .then(() => {
//                                         loadStreaming(dsp);
//                                         document.getElementById('loading').style.opacity = 0;
//                                         document.getElementById("map").style.visibility = 'visible';
//                                         setTimeout(function(){ 
//                                             document.getElementById('loading').style.display = 'none'; 
//                                             zoomMap();
//                                         }, 500)
//                                     })
//                             } else {
//                                 document.getElementById('loading').style.opacity = 0;
//                                 setTimeout(function(){ document.getElementById('loading').style.display = 'none'; }, 500);
//                                 document.getElementById("modal").style.display = 'flex';
//                                 document.getElementById("bgvid").style.display = 'block';                               
//                             }
//                         })
//                     }) 
//                 })
//           }  
//         })
//     })
// }

let dsp = "";
let userEmail = "";

function checkEmail() {
    return new Promise((resolve, reject) => {
        userEmail = getCookie("email_signup")
        dsp = getCookie("dsp")
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
                    console.log(data)
                    map.getSource('BMIS').setData(data)
                    resolve();
                });
                console.log(url)
            
            // Blue BMIS
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
                    
            }, 'waterway-label');
          
           
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
                    // 'line-color': 'rgba(225, 225, 225, 1)',
                    'line-width': 4
                }
            }, 'waterway-label');
            // map.on('click', 'trees-point', function(e) {
            //     new mapboxgl.Popup()
            //         .setLngLat(e.features[0].geometry.coordinates)
            //         .setHTML(`<div id="video-content" style="background: black;">
            //             <div></div>
            //         </div>`)
            //         .on('open', () => {
            //             document.getElementById('video-content').innerHTML = `<div>
            //                 <img style="width: 240px; height: 240px;" src="./assets/bmi_located.gif" />
            //                 <div class="social-modal-button-wrapper">
            //                     <button class="social-modal-button" onclick="socialModal();">Share</button>
            //                 </div>
            //             </div>`
            //         })
            //         .addTo(map)
            // })                        
        })
    });
}

let isAtStart = true;

// function socialModal() {
//     $('#social-modal-wrapper').css({ 'display': 'block' })
//     $('#social-modal').css({
//         'display': 'flex',
//         'opacity': '1'
//     })
// }

function zoomMap() {
    const start = [0, 0];
    const end = [37.0902, -95.7129];
    const target = isAtStart ? end : start;
    
    isAtStart = !isAtStart;
    
    // map.once('moveend',()=>{
    //     showInstructions();
    // })

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
        'display' : 'flex',
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

// function submitForm() {
//     let email = document.getElementById('email').value;
//     let dspSubmit = document.querySelector('input[name = "dsp"]:checked').value;
    
//     document.cookie = `email_signup=${email}`;
//     document.cookie = `dsp=${dspSubmit}`;

//     if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
//         let info = {
//             email: email,
//             dsp: [ dspSubmit ]
//         }
//             return fetch('/mailchimp/add-member', {
//                 method: 'POST',
//                 mode: 'cors',
//                 cache: 'no-cache', 
//                 headers: {
//                 'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify(info)
//             }).then(response => {
//                 return response.json().then(data => {
//                     if (data.status == 400) {
//                         return fetch('/mailchimp/update-member', {
//                             method: 'POST',
//                             mode: 'cors',
//                             cache: 'no-cache',
//                             headers: {
//                                 'Content-Type': 'application/json'
//                             },
//                             body: JSON.stringify(info)
//                         }).then(response => {
//                             loadStreaming(dspSubmit);
//                             document.getElementById("modal").style.opacity = 0;
//                             document.getElementById("modal").style.display = 'none';
//                             document.getElementById("bgvid").style.opacity = 0;
//                             document.getElementById("bgvid").style.display = 'none';
//                             document.getElementById("map").style.visibility = 'visible';
//                             zoomMap();
//                         })
//                     } else {
//                         loadStreaming(dspSubmit);
//                         document.getElementById("modal").style.opacity = 0;
//                         document.getElementById("modal").style.display = 'none';
//                         document.getElementById("bgvid").style.opacity = 0;
//                         document.getElementById("bgvid").style.display = 'none';
//                         document.getElementById("map").style.visibility = 'visible';
//                         zoomMap();
//                     }
//                 })
//             })
//     } else {
//         alert("You have entered an invalid email address!")
//         return false;
//     }
// }

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
$(window).resize(function() {
    if( /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
        if (window.matchMedia("(orientation: portrait)").matches) {
            // you're in PORTRAIT mode
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
            $('#mobile-instructions').css({
                'display' : 'none'
            })
        }

    }
}).resize();

window.onclick = function(event) {
    var socialModalWrapper = document.getElementById('social-modal-wrapper');
    if (event.target == socialModalWrapper) {
        socialModalWrapper.style.display = "none";
    }
}