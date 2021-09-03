const temp = require('temp');
const { createWriteStream } = require('fs');
const got = require('got');
const AdmZip = require('adm-zip');
const { promisify } = require('util');
const stream = require('stream');
const dayjs = require('dayjs');
const { dsvFormat } = require('d3-dsv');
const { max, sum } = require('d3-array');
const pipeline = promisify(stream.pipeline);
const { parallelLimit } = require('async');

// temp.track();
const DAYS_FUTURE = 7;
module.exports = loadStation;

const today = dayjs().startOf('day');

async function loadStation(stationId) {
    const dwdData = await downloadDwdData(stationId);
    const brightskyData = await downloadBrightskyData(stationId, dwdData.slice(-1)[0].date);
    return sumRain([...dwdData, ...brightskyData]).filter(d => d.TXK !== undefined);
}

function downloadDwdData(stationId) {
    const url = `https://opendata.dwd.de/climate_environment/CDC/observations_germany/climate/daily/kl/recent/tageswerte_KL_${stationId}_akt.zip`;
    return new Promise((resolve, reject) => {
        temp.open('dwd', async (err, info) => {
            try {
                await pipeline(got.stream(url), createWriteStream(info.path));
                // extract
                const zip = new AdmZip(info.path);
                const entry = zip.getEntries().find(e => e.entryName.startsWith('produkt_klima_'));
                if (entry) {
                    const csv = await entry.getData().toString('utf8');
                    const data = dsvFormat(';')
                        .parse(csv)
                        .map(row => ({
                            date: dayjs(row.MESS_DATUM.trim()).format('YYYY-MM-DD'),
                            diff: today.diff(row.MESS_DATUM.trim(), 'day'),
                            RSK: +row[' RSK'],
                            TXK: +row[' TXK'],
                            source: 'dwd/recent'
                        }));
                    resolve(data);
                }
            } catch (err) {
                console.error('Could not read ', url);
            }
        });
    });
}

function downloadBrightskyData(stationId, minDate) {
    let date = dayjs(minDate);
    const tasks = [];
    for (let i = DAYS_FUTURE; i > 0; i--) {
        date = date.add(1, 'day');
        const dateFmt = date.format('YYYY-MM-DD');
        tasks.push(async () => {
            const url = `https://api.brightsky.dev/weather?dwd_station_id=${stationId}&date=${dateFmt}`;
            try {
                const res = JSON.parse((await got(url)).body);
                if (res.weather) {
                    const TXK = max(res.weather, d => d.temperature);
                    const RSK = sum(res.weather, d => d.precipitation);
                    return {
                        date: dateFmt,
                        diff: today.diff(dateFmt, 'day'),
                        TXK,
                        RSK,
                        source: `dwd/${res.sources[0].observation_type}`
                    };
                }
            } catch (err) {
                console.error('Could not read ', url);
                return {
                    date: dateFmt,
                    TXK: undefined,
                    RSK: undefined
                };
            }
        });
    }
    return parallelLimit(tasks, 10);
}

function sumRain(data) {
    let sumRain = 0;
    let cleanDataSince = 0;
    return data
        .sort((a, b) => b.diff - a.diff)
        .map((row, i) => {
            if (
                // row.RSK < 0 ||
                // row.RSK === undefined ||
                (i > 0 && row.diff - data[i - 1].diff !== -1)
            ) {
                cleanDataSince = i + 1;
                sumRain = 0;
            } else {
                // do we want to treat missing data as zero
                sumRain += parse(row.RSK);
                if (i > cleanDataSince + 30) {
                    sumRain -= parse(data[i - 30].RSK);
                    row.rain30days = i < 30 ? undefined : +sumRain.toFixed(1);
                }
            }
            return row;
        })
        .map(r => {
            const { diff, ...rest } = r;
            return rest;
        });
}

function parse(val) {
    return val < -900 ? 0 : val || 0;
}

if (process.argv[1] === __filename) {
    // test script
    (async () => {
        const data = await loadStation('01964');
        // console.log(data.slice(0, 10), data.slice(-14));
    })();
}
