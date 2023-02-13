const parseBool = name => Boolean(Number(process.env[name] || 0));

const USE_CACHE = parseBool('USE_CACHE');
const USE_BUCKET = parseBool('USE_BUCKET');

module.exports = {
    USE_CACHE,
    USE_BUCKET,
};
