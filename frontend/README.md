# 🚆 Real-Time Train & Signal Visualization System

This project provides a real-time visualization of train movement and railway signals using Leaflet.js and WebSockets. It simulates train progression on a map and dynamically updates signal statuses based on train position and speed.

## 🌍 Features

* **Live Train Tracking**: Simulates train movement on a map using interpolated coordinates.
* **Signal Status Management**: Changes signal icons (green/yellow/red) dynamically based on train location and speed.
* **Dual Direction Support**: Tracks both **up** and **down** directions with separate signal and train markers.
* **Leaflet Map Integration**: Displays signals and train routes using OpenStreetMap and OpenRailwayMap layers.
* **WebSocket Communication**: Real-time data exchange with the backend to update train coordinates and timescale.

## 📁 Project Structure

* **Signal Management**: Arrays for both up and down signals (`signalCoordinatesArray_up` and `signalCoordinatesArray_down`), dynamically modified for visual spacing.
* **Train Interpolation**: Calculates intermediate coordinates between train points for smooth animation.
* **Map Initialization**: Loads base map with switchable tile layers, signal markers, and train animation.
* **Icon Customization**: Uses different icons for signals (`red`, `green`, `yellow`, `yellow2`) and trains (idle, moving slow, moving fast).

## 📡 WebSocket Events

* `requestData`: Sent on connection to request station and signal data.
* `signalCoordinates`, `trainCoordinates`: Received to initialize or update map.
* `timescaleUpdated`: Updates the speed of the train animation.

## 🧠 Logic Highlights

* **Dynamic Signal Update**: Signals change based on train's proximity, direction, and speed (green → yellow → red).
* **Train Animation**: Continuously moves the train icon across interpolated coordinates with updated speed/timescale.
* **Direction Handling**: `up` and `down` directions use separate markers and coordinate arrays.

## 🗺️ Dependencies

* [Leaflet.js](https://leafletjs.com/) for map rendering.
* [OpenStreetMap](https://www.openstreetmap.org/) and [OpenRailwayMap](https://www.openrailwaymap.org/) for tiles.
