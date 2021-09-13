const fs = require('fs');
const path = require('path');
const got = require('got');
const AdmZip = require('adm-zip');
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);
const mkdirp = require('mkdirp');
const temp = require('temp');

const outDir = path.join(__dirname, '..', 'out');

mkdirp.sync(outDir);

// make sure temporary files get deleted
temp.track();

const url = 'http://download.geonames.org/export/dump/cities5000.zip';

(async () => {
    temp.open('cities', async (err, info) => {
        try {
            await pipeline(got.stream(url), fs.createWriteStream(info.path));
            // extract
            const zip = new AdmZip(info.path);
            const entry = zip.getEntries().find(e => e.entryName === 'cities5000.txt');
            if (entry) {
                const data = (await entry.getData().toString('utf8'))
                    .split('\n')
                    .map(line => line.split('\t'))
                    .filter(row => row[8] === 'DE')
                    .map(row => ({
                        name: row[2],
                        lat: +row[4],
                        lon: +row[5]
                    }));
                fs.writeFileSync(path.join(outDir, 'cities.json'), JSON.stringify(data));
            }
        } catch (err) {
            console.error('Could not read ', url, err);
        }
    });
})();
