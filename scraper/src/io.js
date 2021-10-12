const fs = require('fs/promises');
const path = require('path');

const mkdirp = require('mkdirp');
const aws = require('aws-sdk');
const yargs = require('yargs');

const { USE_BUCKET } = require('./env.js');

const argv = yargs(process.argv.slice(2)).argv;

const outDirLocal = argv.out || path.join(__dirname, '..', 'out');

if (!USE_BUCKET) {
    mkdirp.sync(path.join(outDirLocal, 'stations'));
    mkdirp.sync(path.join(outDirLocal, 'stations', 'weather'));
    mkdirp.sync(path.join(outDirLocal, 'stations', 'context'));
}

const s3 = USE_BUCKET ? new aws.S3({
    region: 'eu-central-1',
}) : null;

async function saveFile(filepath, content) {
    if (USE_BUCKET) {
        const params = {
            Bucket: process.env.BUCKET_DATA_NAME,
            Key: filepath,
            Body: content,
            ACL: 'public-read',
        };
        await s3.upload(params).promise();
    } else {
        await fs.writeFile(path.join(outDirLocal, filepath), content);
    }
}

module.exports = {
    saveFile,
};
