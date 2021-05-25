const path = require('path');
const got = require('got');
const dayjs = require('dayjs');
const { writeFile } = require('fs/promises');
const slugify = require('slugify');
const { csvParse } = require('d3-dsv');
const { mean, sum, quantileSorted, quantile, ascending, group,range} = require('d3-array');
const { ascendingKey, descendingKey } = require('d3-jetpack');

run();

const baseMinYear = 1961;
const tempQuartileRange = 50;

async function run() {
    // download and parse station index, write json
    const stationsCsv = await got('https://data.vis4.net/dwd/stations.csv');

    const stations = csvParse(stationsCsv.body, d => ({
        ...d,
        lat: +d.lat,
        lon: +d.lon,
        altitude: +d.altitude,
        forecast: d.forecast === 'TRUE',
        slug: slugify(d.name, { lower: true, locale: 'de', remove: /[()\/]/ })
    })).filter(d => d.forecast).sort(ascendingKey('slug'));

    await writeFile(
        path.join(__dirname, 'out/stations.json'),
        JSON.stringify(stations, null, 3));

    for (const station of stations) {
        console.log(station.id, station.slug);
        const stationCsv = await got(`https://data.vis4.net/dwd/stations/${station.id}-fc.csv`);

        const stationData = csvParse(stationCsv.body, d => ({
            date: new Date(d.date),
            year: new Date(d.date).getFullYear(),
            day: dayjs(d.date).format('MM-DD'),
            TXK: +d.TXK,
            RSK: +d.RSK
        }));

        const r = updateData(stationData);
        await writeFile(
            path.join(__dirname, `out/stations/${station.id}.json`),
            JSON.stringify({
                station,
                ...r
            }, null, 3));
    }
    // process each station, write json
}

function updateData(data) {
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

    // compute weather context for each day
    const context = {};
    let day = dayjs('2021-01-01');
    while (day.year() === 2021) {
        context[day.format('MM-DD')] = getContext(day, data2);
        day = day.add(1, 'day');
    }

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

    const monthlyStats = {};
    for (const curMonth of range(0,12)) {
        const stats = [];
        group(data2.filter(d => d.date.getMonth() === curMonth), d => d.year).forEach((value, key) => {
            const avgMaxTemp = round(mean(value, d => d.TXK));
            const sumPrecip = sum(value, d => d.RSK !== -999 ? d.RSK : 0);
            stats.push({
                year: key,
                temp: avgMaxTemp,
                precip: sumPrecip
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
            rain30days: Math.round(d.rain30days*10)/10,
            context: context[d.day]
        })).sort(descendingKey('date')).slice(0, 365+14),
        // context,
        monthlyStats
    };

    function getContext(day, data) {
        const fmt = day.format('MM-DD');
        const dates = data.filter(d =>
            d.year >= baseMinYear &&
            d.year < baseMinYear+30 &&
            d.day === fmt
        );
        let tempValues = dates.map(d => d.TXK).sort(ascending);
        let tempRain = 0;
        dates.forEach(d => {
            tempRain += d.rain30days;
        })
        const res = {
            day: fmt,
            TXK: round(mean(tempValues)),
            TXK_lo: round(quantileSorted(tempValues, 0.5-(tempQuartileRange/100)*0.5)),
            TXK_hi: round(quantileSorted(tempValues, 0.5+(tempQuartileRange/100)*0.5)),
            rain30days: round(tempRain / dates.length)
        }
        return res;
    }
}

function round(d) {
    return Math.round(d*10)/10
}