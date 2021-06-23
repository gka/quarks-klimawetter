const argv = require('yargs/yargs')(process.argv.slice(2)).argv;
const path = require('path');
const got = require('got');
const dayjs = require('dayjs');
const { readFile, writeFile } = require('fs/promises');
const slugify = require('slugify');
const { csvParse } = require('d3-dsv');
const { mean, sum, quantileSorted, quantile, ascending, group, range, extent} = require('d3-array');
const { ascendingKey, descendingKey } = require('d3-jetpack');

run();

const analyzeContext = !!argv.context;
console.log({analyzeContext});

const outDir = argv.out || path.join(__dirname, 'out');
const baseMinYear = 1961;
const tempQuartileRange = 50;

const DAYS = [];
let day = dayjs('2021-01-01');
while (day.year() === 2021) {
    DAYS.push(day.format('MM-DD'));
    day = day.add(1, 'day');
}
console.log(DAYS.length);

async function run() {
    // download and parse station index, write json
    console.time();

    const stationsCsv = argv.data ?
        await readFile(path.join(argv.data, 'stations.csv'), 'utf-8') :
        (await got('https://data.vis4.net/dwd/stations.csv')).body;

    const stations = csvParse(stationsCsv, d => ({
        ...d,
        lat: +d.lat,
        lon: +d.lon,
        altitude: +d.altitude,
        forecast: d.forecast === 'TRUE',
        slug: slugify(d.name, { lower: true, locale: 'de', remove: /[()\/]/ })
    })).filter(d => d.forecast && dayjs(d.from).year() <= baseMinYear).sort(ascendingKey('slug'));


    await writeFile(
        path.join(outDir, 'stations.json'),
        JSON.stringify(stations, null, 3));


    for (const station of stations) {
        console.log(station.id, station.slug);

        const stationCsv = argv.data ?
            await readFile(path.join(argv.data, `stations/${station.id}-fc.csv`), 'utf-8') :
            (await got(`https://data.vis4.net/dwd/stations/${station.id}-fc.csv`)).body;

        const stationData = csvParse(stationCsv, d => ({
            date: new Date(d.date),
            year: new Date(d.date).getFullYear(),
            day: dayjs(d.date).format('MM-DD'),
            TXK: +d.TXK,
            RSK: +d.RSK
        }));

        const r = updateData(stationData, station);

        await writeFile(
            path.join(outDir, `stations/${station.id}.json`),
            JSON.stringify({
                station,
                ...r
            }, null, 3));
    }


    // process each station, write json
}

function updateData(data, station) {
    const data2 = data.map(d => ({
        ...d
    }));

    data2.forEach((d,i) => {
        d.prev = data2.length > i ? data2[i+1] : null
    });

    // cumulate rain over 30 days
    data2.forEach(d => {
        d.rain30days = 0;
        let x = d;
        for (let i = 0; i < 30; i++) {
            d.rain30days += x.RSK && x.RSK !== -999 && !isNaN(x.RSK) ? x.RSK : 0;
            if (x.prev) x = x.prev;
            else break;
        }
        delete d.prev;
    });

    // add 14 days of future days
    let date = dayjs(data2[0].date);
    let days = 14;
    while (days-- > 0) {
        // jump one day
        date = date.add(1, 'day');
        data2.push({
            TXK: Number.NaN,
            RSK: -999,
            year: date.year(),
            date: date.toDate(),
            day: date.format('MM-DD'),
        })
    }

    if (analyzeContext) {
        const context = {};
        DAYS.forEach(day => {
            context[day] = getContext(day, data2);
        });
        writeFile(
            path.join(outDir, `stations/${station.id}-ctx.json`),
            JSON.stringify(context, null, 3));
    }

    const monthlyStats = {};
    for (const curMonth of range(0,12)) {
        const stats = [];
        group(data2.filter(d => d.date.getMonth() === curMonth), d => d.year).forEach((value, key) => {
            const avgMaxTemp = round(mean(value, d => d.TXK));
            const tempRange = extent(value, d => d.TXK).map(round);
            const tempValues = value.map(d => d.TXK)
                .filter(d => d !== null && !isNaN(d))
                .sort(ascending);
            const sumPrecip = sum(value, d => d.RSK !== -999 ? d.RSK : 0);
            stats.push({
                year: key,
                temp: avgMaxTemp,
                temp_range: tempRange,
                temp_lo: round(quantileSorted(tempValues, 0.5-(tempQuartileRange/100)*0.5)),
                temp_hi: round(quantileSorted(tempValues, 0.5+(tempQuartileRange/100)*0.5)),
                precip: round(sumPrecip,1)
            })
        });
        const base = stats.filter(d => d.year >= baseMinYear && d.year < baseMinYear+30);
        const monthlyBase = {
            temp_lo: round(quantile(base, 0.5-(tempQuartileRange/100)*0.5, d => d.temp)),
            temp_hi: round(quantile(base, 0.5+(tempQuartileRange/100)*0.5, d => d.temp)),
            precip_lo: round(quantile(base, 0.5-(tempQuartileRange/100)*0.5, d => d.precip)),
            precip_hi: round(quantile(base, 0.5+(tempQuartileRange/100)*0.5, d => d.precip)),
        }
        monthlyStats[curMonth] = {
            stats,
            base: monthlyBase
        };
    }

    return {
        data: data2.map(d => ({
            ...d,
            date: dayjs(d.date).format('YYYY-MM-DD'),
            rain30days: Math.round(d.rain30days*10)/10
        })).sort(descendingKey('date')).slice(0, 365+14),
        // context,
        monthlyStats
    };

    function getContext(day, data) {
        const dates = data.filter(d =>
            d.year >= baseMinYear &&
            d.year < baseMinYear+30 &&
            d.day === day &&
            d.TXK !== null && !isNaN(d.TXK) && d.TXK !== -999
        );

        let tempValues = dates.map(d => d.TXK).sort(ascending);
        let rainValues = dates.map(d => d.rain30days).sort(ascending);

        const records = data.filter(d =>
            d.day === day && d.TXK !== null && !isNaN(d.TXK) && d.TXK !== -999
        ).sort(ascendingKey('TXK')).map(d => ({ year: d.date.getFullYear(), TXK: d.TXK }));

        const res = {
            day,
            TXK: round(mean(tempValues)),
            TXK_10: round(quantileSorted(tempValues, 0.1)),
            TXK_lo: round(quantileSorted(tempValues, 0.25)),
            TXK_hi: round(quantileSorted(tempValues, 0.75)),
            TXK_90: round(quantileSorted(tempValues, 0.9)),
            TXK_records: {
                lo: records.slice(0,3),
                hi: records.slice(-3),
            },
            rain30days: round(mean(rainValues)),
            rain30days_lo: round(quantileSorted(rainValues, 0.25)),
            rain30days_hi: round(quantileSorted(rainValues, 0.75)),
        }
        return res;
    }
}

function round(d) {
    return Math.round(d*10)/10
}