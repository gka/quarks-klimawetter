export function fmtTemp(temp) {
    return temp.toFixed(1).replace('.', ',') + '°C';
}

export function fmtRain(rain, noDay) {
    return String(rain).replace('.', ',') + ` mm${noDay ? '' : '/Tag'}`;
}
