export function findNearestStation (stations, callback) {
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            const station = findNearestStationLL(stations, latitude, longitude);
            callback(station);
        },
        () => {},
    );
}

export function findNearestStationLL (stations, lat, lon) {
    // compute distances
    stations.forEach(s => {
        s.dist = latLonDist(lat, lon, s.lat, s.lon);
    });
    return stations.sort((a, b) => a.dist - b.dist)[0];
}
export function latLonDist (lat1, lon1, lat2, lon2) {
    const p = 0.017453292519943295; // This is  Math.PI / 180
    const c = Math.cos;
    const a =
        0.5 -
        c((lat2 - lat1) * p) / 2 +
        (c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))) / 2;
    const R = 6371; //  Earth distance in km so it will return the distance in km
    return 2 * R * Math.asin(Math.sqrt(a));
}
