import { csvParse } from 'd3-dsv';
import dayjs from 'dayjs';

export default function(csv) {
	return csvParse(csv, d => ({
        date: d.date,
        year: new Date(d.date).getFullYear(),
        day: dayjs(d.date).format('MM-DD'),
        TXK: +d.TXK,
        RSK: +d.RSK
    }));
}