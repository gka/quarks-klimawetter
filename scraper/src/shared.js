function round(d) {
    return Math.round(d * 10) / 10;
}

const quantileConfig = {
	low: 0.20,
	high: 0.80,
}

module.exports = {
    round,
    quantileConfig,
};
