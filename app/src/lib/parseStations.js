import { csvParse } from 'd3-dsv';
import slugify from 'slugify';

export default function(csv) {
	return csvParse(csv, d => ({
	    ...d,
	    from: new Date(d.from),
	    to: new Date(d.to),
	    lat: +d.lat,
	    lon: +d.lon,
	    altitude: +d.altitude,
	    forecast: d.forecast === 'TRUE',
	    slug: slugify(d.name, { lower: true, locale: 'de', remove: /[()\/]/ })
	})).filter(d => d.forecast);
}