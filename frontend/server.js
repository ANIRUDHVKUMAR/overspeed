const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const Papa = require('papaparse');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(port, () => {
    console.log(`Server is listening on http://localhost:${port}`);
});

const wss = new WebSocket.Server({ server });

let trainCoordinatesArray = [];
let stationInfo = [];
let signalCoordinatesArray_down = [];
let interpolatedLocations_up = [];
let timescale = 1.0;

function processData(csvData, targetArray) {
    const rows = csvData.split('\n').slice(1); // Remove header row
    rows.forEach((row, index) => {
        const columns = row.split(',');
        const Latitude = parseFloat(columns[1]);
        const Longitude = parseFloat(columns[2]);
        const Time = parseFloat(columns[0]);
        const Speed = parseInt(columns[3]);
        if (!isNaN(Latitude) && !isNaN(Longitude)) {
            targetArray.push({
                latitude: Latitude,
                longitude: Longitude,
                name: index,
                time_interval: Time,
                speed : Speed
            });
        }
    });
}

function loadData() {
    fs.readFile(path.join(__dirname, 'data', 'stations.csv'), 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading stations CSV file', err);
            return;
        }
        Papa.parse(data, {
            header: true,
            complete: (results) => {
                stationInfo = results.data;
                console.log('Station data loaded');
            }
        });
    });

    fs.readFile(path.join(__dirname, 'data', 'parsedData.csv'), 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading train positions CSV file', err);
            return;
        }
        processData(data, trainCoordinatesArray);
        console.log('Train data loaded');
    });

    fs.readFile(path.join(__dirname, 'data', 'signals.csv'), 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading signals CSV file', err);
            return;
        }
        Papa.parse(data, {
            header: true,
            complete: (results) => {
                signalCoordinatesArray_down = results.data;
                console.log('Signal data loaded');
            }
        });
    });
}

loadData();

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
        const msg = JSON.parse(message);
        if (msg.type === 'updateTimescale') {
            timescale = parseFloat(msg.value);
            console.log('Timescale updated to:', timescale);
            ws.send(JSON.stringify({ type: 'timescaleUpdated', value: timescale }));

            // Broadcast the updated timescale to all connected clients
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'timescaleUpdated', value: timescale }));
                }
            });
        } else if (msg.type === 'requestData') {
            ws.send(JSON.stringify({ stations: stationInfo }));
            ws.send(JSON.stringify({ signalCoordinates: signalCoordinatesArray_down }));

            /*for (let i = 0; i < trainCoordinatesArray.length - 1; i++) {
                const points = interpolatePoints(trainCoordinatesArray[i], trainCoordinatesArray[i + 1], numIntermediatePoints);
                interpolatedLocations_up = interpolatedLocations_up.concat(points);
            }*/

            ws.send(JSON.stringify({ trainCoordinates: trainCoordinatesArray }));
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});