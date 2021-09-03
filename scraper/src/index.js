const argv = require('yargs/yargs')(process.argv.slice(2)).argv;
const path = require('path');
const { writeFile } = require('fs/promises');
const mkdirp = require('mkdirp');
const { loadStationData, loadStationHist } = require('./loadStationData');
const loadStations = require('./loadStations');
const analyzeContext = require('./analyzeContext');
const { round, tempQuartileRange } = require('./shared');
const {
    mean,
    sum,
    quantileSorted,
    ascending,
    group,
    extent
} = require('d3-array');
const dayjs = require('dayjs');

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
            // monthly stats
            stationData.monthly = aggregateMonthly(stationData.data);
            // compress sources
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

function aggregateMonthly(data) {
    const out = [];
    group(
        data,
        d => dayjs(d.date).format('YYYY-MM')
    ).forEach((value, key) => {
        const avgMaxTemp = round(mean(value, d => d.TXK));
        const tempRange = extent(value, d => d.TXK).map(round);
        const tempValues = value
            .map(d => d.TXK)
            .filter(d => d !== null && !isNaN(d))
            .sort(ascending);
        const sumPrecip = sum(value, d => (d.RSK !== -999 ? d.RSK : 0));
        out.push({
            year: +key.split('-')[0],
            month: +key.split('-')[1],
            temp: avgMaxTemp,
            temp_range: tempRange,
            temp_lo: round(quantileSorted(tempValues, 0.5 - (tempQuartileRange / 100) * 0.5)),
            temp_hi: round(quantileSorted(tempValues, 0.5 + (tempQuartileRange / 100) * 0.5)),
            precip: round(sumPrecip, 1)
        });
    });
    return out;
}

(async () => {
    const stations = await loadStations(baseMinYear);
    await writeFile(path.join(outDir, 'stations.json'), JSON.stringify(stations, null, 3));
    if (!!argv.context) {
        await loadContext(stations);
    } else {
        await loadWeather(stations);
    }
})();
