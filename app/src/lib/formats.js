export function fmtTemp(temp, { forcePlus = false } = {}) {
    return (forcePlus && temp > 0 ? '+' : '') + temp.toFixed(1).replace('.', ',') + '°C';
}

export function fmtRain(rain, { forcePlus = false } = {}) {
    return (
        (forcePlus && rain > 0 ? '+' : '') +
        rain.toFixed(rain > 20 ? 0 : 1).replace('.', ',') +
        ` mm`
    );
}
