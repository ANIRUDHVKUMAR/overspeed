const ws = new WebSocket('ws://localhost:3000');

var map;
var flag =0;
var stationInfo = [];
var timescale = 1.0;
let numIntermediatePoints = 10;
var signalCoordinatesArray_down = [
    { latitude : 10.53, longitude: 76.2085, name: "Signal 1" , status : "green"},
    { latitude : 10.5145, longitude: 76.208, name: "Signal 2", status : "green" },
    { latitude : 10.497222, longitude: 76.206, name: "Signal 3" , status : "green"},
    { latitude: 10.484444, longitude: 76.217222, name: "Signal 4" , status : "green" },
    { latitude: 10.473611, longitude: 76.236944, name: "Signal 5" , status : "green" },
    { latitude: 10.4620578, longitude: 76.2435428, name: "Signal 6" , status : "green" },
    { latitude: 10.4481860, longitude: 76.2432473, name: "Signal 7" , status : "green" },
    { latitude: 10.4345823, longitude: 76.2453071, name: "Signal 8" , status : "green" },
    { latitude: 10.4276391, longitude: 76.2508446, name: "Signal 9" , status : "green" },
    { latitude: 10.4197418, longitude: 76.2621085, name: "Signal 10" , status : "green" },
    { latitude: 10.4139240, longitude: 76.2668278, name: "Signal 11" , status : "green" },
    { latitude: 10.4029401, longitude: 76.2752001, name: "Signal 12" , status : "green" },
    { latitude: 10.3899817, longitude: 76.2754669, name: "Signal 13" , status : "green" },
    { latitude: 10.3862815, longitude: 76.2761918, name: "Signal 14" , status : "green" },
    { latitude: 10.3737820, longitude: 76.2720950, name: "Signal 15" , status : "green" },
    { latitude: 10.3602553, longitude: 76.2695088, name: "Signal 16" , status : "green" },
    { latitude: 10.3482021, longitude: 76.2745554, name: "Signal 17" , status : "green" },
    { latitude: 10.3378000, longitude: 76.2834660, name: "Signal 18" , status : "green" },
    { latitude: 10.3310702, longitude: 76.2916849, name: "Signal 19" , status : "green" },
    { latitude: 10.3226088, longitude: 76.3020892, name: "Signal 20" , status : "green" },
    { latitude: 10.3118718, longitude: 76.3106168, name: "Signal 21" , status : "green" },
    { latitude: 10.3026219, longitude: 76.3210146, name: "Signal 22" , status : "green" },
    { latitude: 10.2969764 , longitude: 76.3285972, name: "Signal 23" , status : "green" }
];
var signalCoordinatesArray_up = JSON.parse(JSON.stringify(signalCoordinatesArray_down));;
 for(var i = 0; i < signalCoordinatesArray_down.length; i++) {
    signalCoordinatesArray_down[i].longitude -= 0.0003;
    signalCoordinatesArray_up[i].longitude += 0.0003;
    signalCoordinatesArray_up[i].name += '_up';
 }
var trainCoordinatesArray_down = [
            { latitude: 10.516140, longitude: 76.208461, name: '13', time_interval : 1000 },
            { latitude: 10.508056, longitude: 76.206111, name: '12', time_interval : 1000 },
            { latitude: 10.498056, longitude: 76.205556, name: '11', time_interval : 1000 },
            { latitude: 10.495278, longitude: 76.207222, name: '10', time_interval : 1000 },
            { latitude: 10.490556, longitude: 76.210556, name: '9', time_interval : 1000 },
            { latitude: 10.485, longitude: 76.215278, name: '8', time_interval : 1000 },
            { latitude: 10.484167, longitude: 76.218611, name: '7', time_interval : 1000  },
            { latitude: 10.484167, longitude: 76.223333, name: '6', time_interval : 1000  },
            { latitude: 10.48333, longitude: 76.22777, name: '5', time_interval : 1000  },
            { latitude: 10.48075, longitude: 76.232075, name: '4', time_interval : 1000 },
            { latitude: 10.474722, longitude: 76.235833, name: '3', time_interval : 1000 },
            { latitude: 10.473611, longitude: 76.236944, name: '2', time_interval : 1000 },
            { latitude: 10.472911, longitude: 76.23701, name: '1', time_interval : 1000 }
        ];
var interpolatedLocations_down = [];
var interpolatedLocations_up = [];
var currentIndex_up = 0;
var currentIndex_down = 0;
var currentSet = 'up';
var newMarker = null;
var trainMarker = null;
var trainMarker2 = null;
var signalMarkers_down = [];
var signalMarkers_up = [];
var prev_Index_up = 0;
var prev_Index_down = signalCoordinatesArray_down.length - 1;

ws.onopen = () => {
    console.log('Connected to WebSocket server');
    // Request initial data
    ws.send(JSON.stringify({ type: 'requestData' }));
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.stations) {
        stationInfo = data.stations;

        //console.log('Station Data:', data.stations);
    } else if (data.train) {
        //console.log('Train Data:', data.train);
    } else if (data.signalCoordinates) {
        /*
        signalCoordinatesArray_up = JSON.parse(JSON.stringify(signalCoordinatesArray_down))

        for(var i = 0; i < signalCoordinatesArray_down.length; i++) {
            signalCoordinatesArray_down[i].longitude = parseFloat(signalCoordinatesArray_down[i].longitude) - 0.0003;
            signalCoordinatesArray_up[i].longitude = parseFloat(signalCoordinatesArray_up[i].longitude) + 0.0003;
            signalCoordinatesArray_up[i].name += '_up';
        }*/
        initMap(trainCoordinatesArray_down[0].latitude,trainCoordinatesArray_down[0].longitude);
        //console.log('Signal Data:', data.signalCoordinates);
    } else if (data.trainCoordinates) {
        interpolatedLocations_down = data.trainCoordinates;
        //console.log('Interpolated Locations:', data.interpolatedLocations);
    } else if (data.type === 'timescaleUpdated') {
        //console.log('Timescale Updated to:', data.value);
        document.getElementById('timescale-value').innerText = data.value;
    } else {
        console.log('Received unknown data type:', data);
    }
};

function interpolatePoints(pointA, pointB, numIntermediatePoints) {
    const interpolatedPoints = [];
    const latDiff = (pointB.latitude - pointA.latitude) / (numIntermediatePoints + 1);
    const lonDiff = (pointB.longitude - pointA.longitude) / (numIntermediatePoints + 1);
    for (let i = 1; i <= numIntermediatePoints; i++) {
        const interpolatedLat = pointA.latitude + i * latDiff;
        const interpolatedLon = pointA.longitude + i * lonDiff;
        interpolatedPoints.push({ latitude: interpolatedLat, longitude: interpolatedLon, time_interval: pointA.time_interval });
    }
    interpolatedPoints.push({ latitude: pointB.latitude, longitude: pointB.longitude, time_interval: pointA.time_interval });
    return interpolatedPoints;
}

// Calculate interpolatedLocations outside initMap function
for (let i = 0; i < trainCoordinatesArray_down.length - 1; i++) {
    var points = interpolatePoints(trainCoordinatesArray_down[i], trainCoordinatesArray_down[i+1], numIntermediatePoints);
    interpolatedLocations_up = interpolatedLocations_up.concat(points);
}

// Function to update timescale
function updateTimescale(value) {
    const timescale = parseFloat(value);
    document.getElementById('timescale-value').innerText = timescale;
    ws.send(JSON.stringify({ type: 'updateTimescale', value: timescale }));
}

function placeSignalIcon(map, lat, lon, signalName, signalStatus, signalMarkers) {
            var signalIconUrl = signalStatus === "red" ? 'static/images/red_signal.png' : (signalStatus === "green" ? 'static/images/green_signal.png' : (signalStatus === "yellow" ? 'static/images/yellow_signal.png' : 'static/images/yellow_signal2.png'));

            var signalIcon = L.icon({
                iconUrl: signalIconUrl,
                iconSize: [48, 48], // Icon size
                iconAnchor: [24, 24], // Anchor point of icon
                popupAnchor: [0, -16] // Popup anchor
            });

            // Add marker with signal icon at the specified location
            var signalMarker = L.marker([lat, lon], { icon: signalIcon }).addTo(map);
            signalMarker.bindPopup(signalName); // Set the popup to the signal name
            signalMarkers.push(signalMarker);
        }

        function placeSignalIcon_iter(map, lat, lon, signalName, signalStatus, set, index) {
            var signalIconUrl = signalStatus === "red" ? 'static/images/red_signal.png' : (signalStatus === "green" ? 'static/images/green_signal.png' : (signalStatus === "yellow" ? 'static/images/yellow_signal.png' : 'static/images/yellow_signal2.png'));

            var signalIcon = L.icon({
                iconUrl: signalIconUrl,
                iconSize: [48, 48], // Icon size
                iconAnchor: [24, 24], // Anchor point of icon
                popupAnchor: [0, -16] // Popup anchor
            });

            // Add marker with signal icon at the specified location
            var signalMarker = L.marker([lat, lon], { icon: signalIcon }).addTo(map);
            signalMarker.bindPopup(signalName); // Set the popup to the signal name
            if(set == 'up') {
                signalMarkers_up[index] = signalMarker;
            } else {
                signalMarkers_down[index] = signalMarker;
            }
        }
// Function to place signal icons on the map
        function placeSignalIcons(map, signalMarkers) {
            signalCoordinatesArray_down.forEach(function (coordinate) {
                placeSignalIcon(map, coordinate.latitude, coordinate.longitude, coordinate.name, coordinate.status, signalMarkers);
            });
        }
        function placeSignalIcons_up(map, signalMarkers) {
            signalCoordinatesArray_up.forEach(function (coordinate) {
                placeSignalIcon(map, coordinate.latitude, coordinate.longitude, coordinate.name, coordinate.status, signalMarkers);
            });
        }
        function placeTrainIcon(map, lat, lon, dir, dir_lon, currentSet, speed, signalLocation1, signalLocation5, signalLocation6, signalMarkers, prev_Index) {
            console.log(speed);
        
            let iconUrl;
            if (Math.abs(dir) < 0.000000001 && Math.abs(dir_lon) < 0.0000001) {
                iconUrl = 'static/images/trainicon_2.png';
                console.log(1);
                flag = 0;
            } else {
                if (speed > 80) {
                    iconUrl = 'static/images/yellow_train.png';
                    console.log(2);
                    flag = 1;
                    updateSignalsForFlag(flag, map, signalLocation1, signalLocation5, signalLocation6, signalMarkers, prev_Index, currentSet);
                } else {
                    iconUrl = 'static/images/trainicon.png';
                    console.log(3);
                    flag = 0;
                    if(prev_Index - 2 >= 0){
                    updateSignalsForFlag(flag, map, signalLocation1, signalLocation5, signalLocation6, signalMarkers, prev_Index, currentSet);
                    }    
                }
            }
        
            var trainIcon = L.icon({
                iconUrl: iconUrl,
                iconSize: currentSet === 'down' ? [32, 32] : [24, 24], // Icon size
                iconAnchor: [16, 16], // Anchor point of icon
                popupAnchor: [0, -16] // Popup anchor
            });
        
            // Add marker with train icon at the specified location
            return L.marker([lat, lon], { icon: trainIcon }).addTo(map);
        }
        



function updateSignalsForFlag(flag, map, signalLocation1, signalLocation5, signalLocation6, signalMarkers, prev_Index, currentSet) {
    if (flag == 1) {
        console.log('Flag = 1');
        if (signalLocation1 !== signalLocation5) {
            map.removeLayer(signalMarkers[prev_Index - 1]);
            placeSignalIcon_iter(map, signalLocation5.latitude, signalLocation5.longitude, "Signal " + (prev_Index - 1), "yellow", currentSet, prev_Index - 1);
        }
        if (signalLocation1 !== signalLocation6) {
            map.removeLayer(signalMarkers[prev_Index - 2]);
            placeSignalIcon_iter(map, signalLocation6.latitude, signalLocation6.longitude, "Signal " + (prev_Index - 2), "red", currentSet, prev_Index - 2);
        }
    } else {
        console.log('Flag = 0');
        if (signalLocation1 !== signalLocation5) {
            map.removeLayer(signalMarkers[prev_Index - 1]);
            placeSignalIcon_iter(map, signalLocation5.latitude, signalLocation5.longitude, "Signal " + (prev_Index - 1), "green", currentSet, prev_Index - 1);
        }
        if (signalLocation1 !== signalLocation6) {
            map.removeLayer(signalMarkers[prev_Index - 2]);
            placeSignalIcon_iter(map, signalLocation6.latitude, signalLocation6.longitude, "Signal " + (prev_Index - 2), "green", currentSet, prev_Index - 2);
        }
    }
}        
        
// Function to update train marker position
function updateMarker(map) {
            

            var interpolatedLocations = currentSet === 'up' ? interpolatedLocations_up : interpolatedLocations_down;
            var signalCoordinatesArray = currentSet === 'up' ? signalCoordinatesArray_up : signalCoordinatesArray_down;
            var currentIndex = currentSet === 'up' ? currentIndex_up : currentIndex_down;
            var trainMarkerToUpdate = currentSet === 'up' ? trainMarker2 : trainMarker;
            var prev_Index = currentSet == 'up' ? prev_Index_up : prev_Index_down;
            var signalMarkers = currentSet == 'up' ? signalMarkers_up : signalMarkers_down;
            console.log(currentSet);
            if (currentIndex < interpolatedLocations.length) {
                var location = interpolatedLocations[currentIndex];
                var latlng = L.latLng(location.latitude, location.longitude);
                var dir = interpolatedLocations[currentIndex].latitude - interpolatedLocations[(currentIndex === 0 ? currentIndex : currentIndex - 1)].latitude
                var dir2 = dir;
                var dir_lon = interpolatedLocations[currentIndex].longitude - interpolatedLocations[(currentIndex === 0 ? currentIndex : currentIndex - 1)].longitude
                var dir_lon2 = dir_lon;
                if (dir < 0 ) {
                    if(prev_Index + 1 < signalCoordinatesArray.length) {
                        if (signalCoordinatesArray[prev_Index + 1].latitude > location.latitude) {
                            prev_Index = prev_Index + 1;
                            //console.log(prev_Index)
                            if(currentSet == 'up') {
                                prev_Index_up = prev_Index;
                            } else {
                                prev_Index_down = prev_Index;
                            }
                            var signalLocation1 = signalCoordinatesArray[prev_Index];
                            var signalLocation2 = (prev_Index - 1 >= 0) ? signalCoordinatesArray[prev_Index - 1] : signalCoordinatesArray[prev_Index];
                            var signalLocation3 = (prev_Index - 2 >= 0) ? signalCoordinatesArray[prev_Index - 2] : signalCoordinatesArray[prev_Index];
                            var signalLocation4 = (prev_Index - 3 >= 0) ? signalCoordinatesArray[prev_Index - 3] : signalCoordinatesArray[prev_Index];
                            var signalLocation5 = (prev_Index + 1 >= 0) ? signalCoordinatesArray[prev_Index + 1] : signalCoordinatesArray[prev_Index];
                            var signalLocation6 = (prev_Index + 2 >= 0) ? signalCoordinatesArray[prev_Index + 2] : signalCoordinatesArray[prev_Index];
                            map.removeLayer(signalMarkers[prev_Index]);
                            placeSignalIcon_iter(map, signalLocation1.latitude, signalLocation1.longitude, "Signal " + (prev_Index), "red", currentSet, prev_Index);
                            if(signalLocation1 !== signalLocation2) {
                                map.removeLayer(signalMarkers[prev_Index-1]);
                                placeSignalIcon_iter(map, signalLocation2.latitude, signalLocation2.longitude, "Signal " + (prev_Index - 1), "yellow", currentSet, prev_Index-1);
                            }
                            if(signalLocation1 !== signalLocation3) {
                                map.removeLayer(signalMarkers[prev_Index-2]);
                                placeSignalIcon_iter(map, signalLocation3.latitude, signalLocation3.longitude, "Signal " + (prev_Index - 2), "yellow2", currentSet, prev_Index-2);
                            }
                            if(signalLocation1 !== signalLocation4){
                                map.removeLayer(signalMarkers[prev_Index-3]);
                                placeSignalIcon_iter(map, signalLocation4.latitude, signalLocation4.longitude, "Signal " + (prev_Index - 3), "green", currentSet, prev_Index-3)
                            }
                        }
                    }
                } else if (dir > 0) {
                    if(prev_Index - 1 >= 0) {
                        if (signalCoordinatesArray[prev_Index - 1].latitude < location.latitude) {
                            prev_Index = prev_Index - 1;
                            //console.log(prev_Index)
                            if(currentSet == 'up') {
                                prev_Index_up = prev_Index;
                            } else {
                                prev_Index_down = prev_Index;
                            }
                            var signalLocation1 = signalCoordinatesArray[prev_Index];
                            var signalLocation2 = (prev_Index + 1 < signalCoordinatesArray.length) ? signalCoordinatesArray[prev_Index + 1] : signalCoordinatesArray[prev_Index];
                            var signalLocation3 = (prev_Index + 2 < signalCoordinatesArray.length) ? signalCoordinatesArray[prev_Index + 2] : signalCoordinatesArray[prev_Index];
                            var signalLocation4 = (prev_Index + 3 < signalCoordinatesArray.length) ? signalCoordinatesArray[prev_Index + 3] : signalCoordinatesArray[prev_Index];
                            var signalLocation5 = (prev_Index - 1 < signalCoordinatesArray.length) ? signalCoordinatesArray[prev_Index - 1] : signalCoordinatesArray[prev_Index];
                            var signalLocation6 = (prev_Index - 2 < signalCoordinatesArray.length) ? signalCoordinatesArray[prev_Index - 2] : signalCoordinatesArray[prev_Index];
                            map.removeLayer(signalMarkers[prev_Index]);
                            placeSignalIcon_iter(map, signalLocation1.latitude, signalLocation1.longitude, "Signal " + (prev_Index), "red", currentSet, prev_Index);
                            if(signalLocation1 !== signalLocation2) {
                                map.removeLayer(signalMarkers[prev_Index+1]);
                                placeSignalIcon_iter(map, signalLocation2.latitude, signalLocation2.longitude, "Signal " + (prev_Index + 1), "yellow", currentSet, prev_Index+1);
                            }
                            if(signalLocation1 !== signalLocation3) {
                                map.removeLayer(signalMarkers[prev_Index+2]);
                                placeSignalIcon_iter(map, signalLocation3.latitude, signalLocation3.longitude, "Signal " + (prev_Index + 2), "yellow2", currentSet, prev_Index+2);
                            }
                            if(signalLocation1 !== signalLocation4){
                                map.removeLayer(signalMarkers[prev_Index+3]);
                                placeSignalIcon_iter(map, signalLocation4.latitude, signalLocation4.longitude, "Signal " + (prev_Index + 3), "green", currentSet, prev_Index+3)
                            }
                        }
                    }
                } else {
                    if (dir_lon < 0) {
                        if(prev_Index - 1 >= 0) {
                            if (signalCoordinatesArray[prev_Index - 1].latitude < location.latitude) {
                                prev_Index = prev_Index - 1;
                                //console.log(prev_Index)
                                if(currentSet == 'up') {
                                    prev_Index_up = prev_Index;
                                } else {
                                    prev_Index_down = prev_Index;
                                }
                                var signalLocation1 = signalCoordinatesArray[prev_Index];
                                var signalLocation2 = (prev_Index + 1 < signalCoordinatesArray.length) ? signalCoordinatesArray[prev_Index + 1] : signalCoordinatesArray[prev_Index];
                                var signalLocation3 = (prev_Index + 2 < signalCoordinatesArray.length) ? signalCoordinatesArray[prev_Index + 2] : signalCoordinatesArray[prev_Index];
                                var signalLocation4 = (prev_Index + 3 < signalCoordinatesArray.length) ? signalCoordinatesArray[prev_Index + 3] : signalCoordinatesArray[prev_Index];
                                var signalLocation5 = (prev_Index - 1 < signalCoordinatesArray.length) ? signalCoordinatesArray[prev_Index - 1] : signalCoordinatesArray[prev_Index];
                                var signalLocation6 = (prev_Index - 2 < signalCoordinatesArray.length) ? signalCoordinatesArray[prev_Index - 2] : signalCoordinatesArray[prev_Index];
                                map.removeLayer(signalMarkers[prev_Index]);
                                placeSignalIcon_iter(map, signalLocation1.latitude, signalLocation1.longitude, "Signal " + (prev_Index), "red", currentSet, prev_Index);
                                if(signalLocation1 !== signalLocation2) {
                                    map.removeLayer(signalMarkers[prev_Index+1]);
                                    placeSignalIcon_iter(map, signalLocation2.latitude, signalLocation2.longitude, "Signal " + (prev_Index + 1), "yellow", currentSet, prev_Index+1);
                                }
                                if(signalLocation1 !== signalLocation3) {
                                    map.removeLayer(signalMarkers[prev_Index+2]);
                                    placeSignalIcon_iter(map, signalLocation3.latitude, signalLocation3.longitude, "Signal " + (prev_Index + 2), "yellow2", currentSet, prev_Index+2);
                                }
                                if(signalLocation1 !== signalLocation4){
                                    map.removeLayer(signalMarkers[prev_Index+3]);
                                    placeSignalIcon_iter(map, signalLocation4.latitude, signalLocation4.longitude, "Signal " + (prev_Index + 3), "green", currentSet, prev_Index+3)
                                }
                            }
                        }
                    } else if (dir_lon > 0) {
                        if(prev_Index + 1 < signalCoordinatesArray.length) {
                            if (signalCoordinatesArray[prev_Index + 1].latitude > location.latitude) {
                                prev_Index = prev_Index + 1;
                                //console.log(prev_Index)
                                if(currentSet == 'up') {
                                    prev_Index_up = prev_Index;
                                } else {
                                    prev_Index_down = prev_Index;
                                }
                                var signalLocation1 = signalCoordinatesArray[prev_Index];
                                var signalLocation2 = (prev_Index - 1 >= 0) ? signalCoordinatesArray[prev_Index - 1] : signalCoordinatesArray[prev_Index];
                                var signalLocation3 = (prev_Index - 2 >= 0) ? signalCoordinatesArray[prev_Index - 2] : signalCoordinatesArray[prev_Index];
                                var signalLocation4 = (prev_Index - 3 >= 0) ? signalCoordinatesArray[prev_Index - 3] : signalCoordinatesArray[prev_Index];
                                var signalLocation5 = (prev_Index + 1 >= 0) ? signalCoordinatesArray[prev_Index + 1] : signalCoordinatesArray[prev_Index];
                                var signalLocation6 = (prev_Index + 2 >= 0) ? signalCoordinatesArray[prev_Index + 2] : signalCoordinatesArray[prev_Index];
                                map.removeLayer(signalMarkers[prev_Index]);
                                placeSignalIcon_iter(map, signalLocation1.latitude, signalLocation1.longitude, "Signal " + (prev_Index), "red", currentSet, prev_Index);
                                if(signalLocation1 !== signalLocation2) {
                                    map.removeLayer(signalMarkers[prev_Index-1]);
                                    placeSignalIcon_iter(map, signalLocation2.latitude, signalLocation2.longitude, "Signal " + (prev_Index - 1), "yellow", currentSet, prev_Index-1);
                                }
                                if(signalLocation1 !== signalLocation3) {
                                    map.removeLayer(signalMarkers[prev_Index-2]);
                                    placeSignalIcon_iter(map, signalLocation3.latitude, signalLocation3.longitude, "Signal " + (prev_Index - 2), "yellow2", currentSet, prev_Index-2);
                                }
                                if(signalLocation1 !== signalLocation4){
                                    map.removeLayer(signalMarkers[prev_Index-3]);
                                    placeSignalIcon_iter(map, signalLocation4.latitude, signalLocation4.longitude, "Signal " + (prev_Index - 3), "green", currentSet, prev_Index-3)
                                }
                            }
                        }
                    }
                }
            }
                // Remove previously placed train marker
                if (trainMarkerToUpdate) {
                    map.removeLayer(trainMarkerToUpdate);
                }

                // Place the new train marker
                if(currentIndex < interpolatedLocations.length){
                    var newMarker = placeTrainIcon(map, location.latitude, location.longitude, dir2, dir_lon2, currentSet, location.speed, signalLocation1, signalLocation5, signalLocation6, signalMarkers, prev_Index);
                }

                /*if(currentSet === 'down') {
                    map.setView([location.latitude, location.longitude], 14);
                } */

                if (currentSet === 'up') {
                    trainMarker2 = newMarker;
                    if(currentIndex_up < interpolatedLocations_up.length){
                        currentIndex_up++;
                    }
                } else {
                    trainMarker = newMarker;
                    if(currentIndex_down < interpolatedLocations_down.length){
                        currentIndex_down++;
                    }
                }

                // Switch sets and call updateMarker recursively after both sets have been updated
                if (currentSet === 'up') {
                    currentSet = 'down';
                } else {
                    currentSet = 'up';
                }

                setTimeout(function() {
                    updateMarker(map);
                }, interpolatedLocations[currentIndex < interpolatedLocations.length ? currentIndex : interpolatedLocations.length - 1].time_interval / timescale);
        }

function animateTrainMovement(map) {
    updateMarker(map);
}
function initMap(lat, lng) {
            // Set center and zoom based on the first station location
            map = L.map('map').setView([lat, lng], 15);
            // Choose your preferred tile provider (e.g., OpenStreetMap)
            var openStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            // Define different map styles for OpenRailwayMap
            var tileLayers = {
                "Standard": 'http://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
                "Signals": 'http://{s}.tiles.openrailwaymap.org/signals/{z}/{x}/{y}.png',
                "Maxspeed": 'http://{s}.tiles.openrailwaymap.org/maxspeed/{z}/{x}/{y}.png'
            };

            // Create a new layer control with radio buttons
            var layerControl = L.control.layers({}, {}, {
                collapsed: false, // Expanded by default
                sortLayers: true, // Sort layers alphabetically
                position: 'topright' // Position the control to the top-right corner
            }).addTo(map);

            // Add all layers to the layer control
            for (var styleName in tileLayers) {
                var tileLayer = L.tileLayer(tileLayers[styleName]);
                var input = document.createElement("input");
                input.type = "radio";
                input.name = "baseLayer";
                input.id = styleName;
                input.checked = (styleName == "Standard");
                layerControl.addBaseLayer(tileLayer, styleName);
            }

            // Define function to update max bounds and handle map movement
            function updateMapBounds() {
                var mapBounds = map.getBounds();
                var mapMaxBounds = mapBounds.pad(0.1); // Increase max bounds padding for smoother panning
                map.setMaxBounds(mapMaxBounds);

                // Get the boundaries of the map displayed on the screen
                var southWest = mapBounds.getSouthWest();
                var northEast = mapBounds.getNorthEast();

                // Iterate over stationInfo array to add markers for stations within the displayed boundaries
                /*for (var i = 0; i < stationInfo.length; i++) {
                    var station = stationInfo[i];
                    var stationLat = parseFloat(station.lat);
                    var stationLon = parseFloat(station.lon);

                    // Check if station is within the displayed boundaries
                    if (stationLat >= southWest.lat && stationLat <= northEast.lat && stationLon >= southWest.lng && stationLon <= northEast.lng) {
                        var stationMarker = L.marker([stationLat, stationLon]).addTo(map);
                        stationMarker.bindPopup(Station ID: ${station.id}<br>Station Name: ${station.station_name});
                    }
                }*/
            }

            // Call the function to update max bounds and handle map movement
            updateMapBounds();

            // Listen for move and zoom events on the map to update bounds
            map.on('moveend zoomend', updateMapBounds);

            // Add event listener to the grayscale checkbox
            var grayscaleCheckbox = document.getElementById('grayscaleCheckbox');
            grayscaleCheckbox.addEventListener('change', function () {
                if (this.checked) {
                    document.body.classList.add('grayscale');
                } else {
                    document.body.classList.remove('grayscale');
                }
            });

            // Call the function to place signal icons
            placeSignalIcons(map, signalMarkers_down);
            placeSignalIcons_up(map, signalMarkers_up);
            // Call the function to start the train animation
            animateTrainMovement(map);
        }