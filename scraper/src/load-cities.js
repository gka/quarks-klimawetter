const got = require('got');
const { csvParse } = require('d3-dsv');

const { saveFile } = require('./io.js');

const url = process.env.CITIES_SHEETS_URL;

module.exports = async () => {
    const response = await got(url);
    const data = csvParse(response.body, row => {
        delete row.duplicate;
        row.lat = +row.lat;
        row.lng = +row.lng;
        return row;
    });
    await saveFile('cities.json', JSON.stringify(data));
};
