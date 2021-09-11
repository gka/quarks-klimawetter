export function fmtTemp(temp) {
    return temp.toFixed(1).replace('.', ',') + '°C';
}

export function fmtRain(rain, noDay) {
    return rain.toFixed(rain > 20 ? 0 : 1).replace('.', ',') + ` mm${noDay ? '' : '/Tag'}`;
}
