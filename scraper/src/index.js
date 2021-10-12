const yargs = require('yargs');
const path = require('path');
const withSentry = require("serverless-sentry-lib");
const {
    mean,
    sum,
    quantileSorted,
    ascending,
    group,
    extent
} = require('d3-array');
const dayjs = require('dayjs');
const { parallelLimit } = require('async');

const { loadStationData, loadStationHist } = require('./loadStationData.js');
const loadStations = require('./loadStations.js');
const loadCities = require('./load-cities.js');
const analyzeContext = require('./analyzeContext.js');
const { round, tempQuartileRange } = require('./shared.js');
const { saveFile } = require('./io.js');

const argv = yargs(process.argv.slice(2)).argv;

const baseMinYear = 1961;


async function loadContext(stations) {
    const promises = stations.map((station) => (async () => {
        console.log(station.id, station.slug);
        const hist = await loadStationHist(station.id);
        // compute stats for each day
        const ctx = analyzeContext(hist, baseMinYear);
        await saveFile(
            path.join('stations', 'context', `${station.id}.json`),
            JSON.stringify(ctx)
        );
    }));

    await parallelLimit(promises, 4);
}


async function loadWeather(stations) {
    for (const station of stations) {
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

            await saveFile(
                path.join('stations', 'weather', `${station.id}.json`),
                JSON.stringify(stationData)
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

// AWS Lambda handlers
const scrapeContext = withSentry(async function (event, context) {
    console.info('Scraping context');

    console.info('Loading stations...');
    const stations = await loadStations(baseMinYear);
    await saveFile("stations.json", JSON.stringify(stations));

    console.info('Loading context...');
    await loadContext(stations);

    console.info('Done!');
    return context.logStreamName;
});


const scrapeWeather = withSentry(async function (event, context) {
    console.info('Scraping weather');

    console.info('Loading stations...');
    const stations = await loadStations(baseMinYear);

    console.info('Loading weather...');
    await loadWeather(stations);

    console.info('Done!');
    return context.logStreamName;
});


const scrapeCities = withSentry(async function (event, context) {
    console.info('Scraping Cities');

    console.info('Loading Cities...');
    await loadCities();

    console.info('Done!');
    return context.logStreamName;
});


// direct invocation
(async () => {
    if (!!argv.context) {
        const stations = await loadStations(baseMinYear);
        await saveFile('stations.json', JSON.stringify(stations));
        await loadContext(stations);
    } else if (!!argv.weather) {
        const stations = await loadStations(baseMinYear);
        await loadWeather(stations);
    } else if (!!argv.cities) {
        await loadCities();
    }
})();

module.exports = {
    scrapeContext,
    scrapeWeather,
    scrapeCities
};
