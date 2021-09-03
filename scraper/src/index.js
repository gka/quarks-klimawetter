const argv = require('yargs/yargs')(process.argv.slice(2)).argv;
const path = require('path');
const got = require('got');
const slugify = require('slugify');
const { csvParse } = require('d3-dsv');
const { readFile, writeFile } = require('fs/promises');
const mkdirp = require('mkdirp');
const dayjs = require('dayjs');
const { loadStationData, loadStationHist } = require('./loadStationData');
const loadStations = require('./loadStations');
const analyzeContext = require('./analyzeContext');

const outDir = argv.out || path.join(__dirname, '..', 'out');
const baseMinYear = 1961;

mkdirp.sync(path.join(outDir, 'stations'));

async function loadContext(stations) {
    for (station of stations) {
        console.log(station.id, station.slug);
        const hist = await loadStationHist(station.id);
        // compute stats for each day
        const ctx = analyzeContext(hist, baseMinYear);
        await writeFile(
            path.join(outDir, 'stations', `${station.id}-ctx.json`),
            JSON.stringify(ctx, null, 3)
        );
    }
}

async function loadWeather(stations) {
    for (station of stations) {
        console.log(station.id, station.slug);
        const stationData = {
            station,
            last_update: new Date(),
            data: await loadStationData(station.id),
            sources: []
        };
        if (stationData.data) {
            station.last_date = stationData.data.slice(-1)[0].date;
            const srcs = {};
            stationData.data.forEach(row => {
                if (srcs[row.source] === undefined) {
                    srcs[row.source] = stationData.sources.length;
                    stationData.sources.push(row.source);
                }
                row.source = srcs[row.source];
            });
            await writeFile(
                path.join(outDir, 'stations', `${station.id}.json`),
                JSON.stringify(stationData, null, 3)
            );
        } else {
            station.ignore = true;
        }
    }
}


(async () => {
    const stations = await loadStations(baseMinYear);
    if (!!argv.context) {
        await loadContext(stations);
    } else {
        await loadWeather(stations);
    }
})();