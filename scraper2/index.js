const argv = require('yargs/yargs')(process.argv.slice(2)).argv;
const path = require('path');
const got = require('got');
const slugify = require('slugify');
const { csvParse } = require('d3-dsv');
const { readFile, writeFile } = require('fs/promises');
const mkdirp = require('mkdirp');
const dayjs = require('dayjs');
const loadStation = require('./loadStation');

const outDir = argv.out || path.join(__dirname, 'out');
const baseMinYear = 1961;

mkdirp.sync(path.join(outDir, 'stations'));

async function run() {
    const stations = await loadStations();

    for (station of stations) {
        console.log(station.id, station.slug);
        const stationData = {
            station,
            last_update: new Date(),
            data: await loadStation(station.id),
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
            })
            await writeFile(
                path.join(outDir, 'stations', `${station.id}.json`),
                JSON.stringify(stationData, null, 3)
            );
        } else {
            station.ignore = true;
        }
    }

    await writeFile(
        path.join(outDir, 'stations.json'),
        JSON.stringify(
            stations.filter(d => !d.ignore),
            null,
            3
        )
    );
    // loadStation()
}

async function loadStations() {
    const url =
        'https://opendata.dwd.de/climate_environment/CDC/observations_germany/climate/daily/kl/historical/KL_Tageswerte_Beschreibung_Stationen.txt';
    const raw = (await got(url, { encoding: 'latin1' })).body;
    return parseFixedWidth(raw, {
        skip: 3,
        widths: [5, 9, 9, 15, 12, 10, 42, 22],
        names: ['id', 'from', 'to', 'altitude', 'lat', 'lon', 'name', 'state']
    })
        .map(station => ({
            ...station,
            from: dayjs(station.from).format('YYYY-MM-DD'),
            to: dayjs(station.to).format('YYYY-MM-DD'),
            slug: slugify(station.name, { lower: true, locale: 'de', remove: /[()\/]/ }),
            altitude: +station.altitude,
            lat: +station.lat,
            lon: +station.lon
        }))
        .filter(d => dayjs(d.from).year() <= baseMinYear && dayjs().diff(d.to, 'day') < 5)
        .sort((a,b) => a.slug > b.slug ? 1 : b.slug > a.slug ? -1 : 0);
}

function parseFixedWidth(data, { skip = 0, widths = [], names = [], trim = true }) {
    const rows = data.split('\n').slice(skip);
    return rows.map(row => {
        const d = {};
        let offset = 0;
        widths.forEach((w, i) => {
            d[names[i]] = row.substr(offset, w);
            offset += w;
            if (trim) d[names[i]] = d[names[i]].trim();
        });
        return d;
    });
}

// run();
if (process.argv[1] === __filename) {
    // test script
    run();
}
