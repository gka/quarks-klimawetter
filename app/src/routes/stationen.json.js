import { csvParse } from 'd3-dsv';
import slugify from 'slugify';

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export async function get() {
	const res = await fetch('https://data.vis4.net/dwd/stations.csv');
	const csv = await res.text();
	const out = csvParse(csv, d => ({
		...d,
		from: new Date(d.from),
		to: new Date(d.to),
		lat: +d.lat,
		lon: +d.lon,
		altitude: +d.altitude,
		forecast: d.forecast === 'TRUE',
		slug: slugify(d.name, { lower: true, locale: 'de', remove: /[()]/ })
	})).filter(d => d.forecast);
	return {
		body: out
	}
}