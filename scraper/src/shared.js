function round (d) {
    return Math.round(d * 10) / 10;
}

const quantileConfig = {
    low: 0.2,
    high: 0.8,
};

module.exports = {
    round,
    quantileConfig,
};
