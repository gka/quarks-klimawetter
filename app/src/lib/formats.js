export function fmtTemp(temp) {
    return String(temp).replace('.',',')+'°C'
}

export function fmtRain(rain) {
    return String(rain).replace('.',',')+' mm/Tag'
}