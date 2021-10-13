const fs = require('fs/promises');
const path = require('path');

const mkdirp = require('mkdirp');
const AWS = require('aws-sdk');
const yargs = require('yargs');

const { USE_BUCKET } = require('./env.js');

const argv = yargs(process.argv.slice(2)).argv;

const outDirLocal = argv.out || path.join(__dirname, '..', 'out');

if (!USE_BUCKET) {
    mkdirp.sync(path.join(outDirLocal, 'stations'));
    mkdirp.sync(path.join(outDirLocal, 'stations', 'weather'));
    mkdirp.sync(path.join(outDirLocal, 'stations', 'context'));
}

const s3 = USE_BUCKET ? new AWS.S3({
    region: 'eu-central-1',
}) : null;

const cloudfront = USE_BUCKET ? new AWS.CloudFront({
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

async function createInvalidation(path) {
    if (USE_BUCKET) {
        const params = {
            DistributionId: process.env.CLOUDFRONT_ID,
            InvalidationBatch: {
                CallerReference: `${Date.now()}`,
                Paths: {
                    Quantity: 1,
                    Items: [path],
                },
            },
        };
        await cloudfront.createInvalidation(params).promise();
    }
}

module.exports = {
    saveFile,
    createInvalidation,
};
