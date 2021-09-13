const fs = require('fs');
const path = require('path');

const data = fs.readFileSync(path.join(__dirname, '../data/cities5000.txt'), 'utf-8')
    .split('\n')
    .map(line => line.split('\t'))
    .filter(row => row[8] === 'DE')
    .map(row => ({
        name: row[2],
        lat: +row[4],
        lon: +row[5]
    }))

fs.writeFileSync(path.join(__dirname, '../data/cities.json'), JSON.stringify(data));


