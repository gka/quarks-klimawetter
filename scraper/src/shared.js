function round(d) {
    return Math.round(d * 10) / 10;
}

const quantileConfig = {
	low: 0.15,
	high: 0.85,
}

module.exports = {
    round,
    quantileConfig,
};
