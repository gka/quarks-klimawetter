export function fmtTemp(temp) {
    return String(temp).replace('.',',')+'°C'
}

export function fmtRain(rain, noDay) {
    return String(rain).replace('.',',')+` mm${noDay ? '' : '/Tag'}`
}