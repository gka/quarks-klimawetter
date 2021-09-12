const dayjs = require('dayjs');
const { round, tempQuartileRange } = require('./shared');
const {
    mean,
    sum,
    quantileSorted,
    quantile,
    ascending,
    group,
    range,
    extent
} = require('d3-array');
const { ascendingKey } = require('d3-jetpack');



const DAYS = [];
let day = dayjs('2021-01-01');
while (day.year() === 2021) {
    DAYS.push(day.format('MM-DD'));
    day = day.add(1, 'day');
}

function analyzeContext(data, baseMinYear) {
    // add some useful date keys
    data.forEach(row => {
        const date = dayjs(row.date);
        row.year = date.year();
        row.day = date.format('MM-DD');
        row.month = date.month();
    });
    // console.log(data.slice(0,4))
    const daily = {};
    DAYS.forEach(day => {
        daily[day] = getDailyContext(data, day, baseMinYear);
    });
    const monthly = {};
    range(12).forEach(month => {
        monthly[month] = getMonthlyContext(data, month, baseMinYear);
    });
    return { daily, monthly };
}

function getDailyContext(data, day, baseMinYear) {
    const datesTemp = data.filter(
        d =>
            d.year >= baseMinYear &&
            d.year < baseMinYear + 30 &&
            d.day === day &&
            d.TXK !== null &&
            !isNaN(d.TXK) &&
            d.TXK !== -999
    );
    const datesRain = data.filter(
        d =>
            d.year >= baseMinYear &&
            d.year < baseMinYear + 30 &&
            d.day === day &&
            d.rain30days !== null &&
            !isNaN(d.rain30days)
    );
    let tempValues = datesTemp.map(d => d.TXK).sort(ascending);
    let rainValues = datesRain.map(d => d.rain30days).sort(ascending);

    const records = data
        .filter(d => d.day === day && d.TXK !== null && !isNaN(d.TXK) && d.TXK !== -999)
        .sort(ascendingKey('TXK'))
        .map(d => ({ year: d.year, TXK: d.TXK }));

    const res = {
        day,
        TXK: round(mean(tempValues)),
        TXK_10: round(quantileSorted(tempValues, 0.1)),
        TXK_lo: round(quantileSorted(tempValues, 0.25)),
        TXK_hi: round(quantileSorted(tempValues, 0.75)),
        TXK_90: round(quantileSorted(tempValues, 0.9)),
        TXK_records: {
            lo: records.slice(0, 3),
            hi: records.slice(-3)
        },
        rain30days: round(mean(rainValues)),
        rain30days_lo: round(quantileSorted(rainValues, 0.25)),
        rain30days_hi: round(quantileSorted(rainValues, 0.75))
    };
    return res;
}

/**
 * @param {array} data  list of daily max. temperatures (TXK) and precipitation (RSK)
 * @param {number} month the month index
 * @param {number} baseMinYear begin of 30-year context period
 * @returns {object}
 */
function getMonthlyContext(data, month, baseMinYear) {
    const stats = [];
    group(
        data.filter(d => d.month === month),
        d => d.year
    ).forEach((value, key) => {
        const tempNoNA = value.filter(d => d => d.TXK !== null && !isNaN(d.TXK) && d.TXK > -999);
        const avgMaxTemp = round(mean(tempNoNA, d => d.TXK));
        const tempRange = extent(tempNoNA, d => d.TXK).map(round);
        const tempValues = tempNoNA
            .map(d => d.TXK)
            .sort(ascending);
        const sumPrecip = sum(value, d => (d.RSK !== -999 ? d.RSK : 0));
        stats.push({
            year: key,
            temp: avgMaxTemp,
            temp_range: tempRange,
            temp_lo: round(quantileSorted(tempValues, 0.5 - (tempQuartileRange / 100) * 0.5)),
            temp_hi: round(quantileSorted(tempValues, 0.5 + (tempQuartileRange / 100) * 0.5)),
            precip: round(sumPrecip, 1)
        });
    });
    const base = stats.filter(d => d.year >= baseMinYear && d.year < baseMinYear + 30);
    const monthlyBase = {
        temp_lo: round(quantile(base, 0.5 - (tempQuartileRange / 100) * 0.5, d => d.temp)),
        temp_hi: round(quantile(base, 0.5 + (tempQuartileRange / 100) * 0.5, d => d.temp)),
        precip_lo: round(quantile(base, 0.5 - (tempQuartileRange / 100) * 0.5, d => d.precip)),
        precip_hi: round(quantile(base, 0.5 + (tempQuartileRange / 100) * 0.5, d => d.precip))
    };
    return {
        stats,
        base: monthlyBase
    };
}



module.exports = analyzeContext;

if (process.argv[1] === __filename) {
    // test script
    const { loadStationHist } = require('./loadStationData');
    (async () => {
        const hist = await loadStationHist('00400');
        console.log('x', hist.slice(0, 10));
        const { daily, monthly } = analyzeContext(hist, 1961);
        console.log(daily);
        console.log(monthly, monthly[5].stats.slice(-5));
    })();
}
