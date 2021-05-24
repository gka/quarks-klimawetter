/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export async function get({ params }) {
	// the `slug` parameter is available because this file
	// is called [slug].json.js
	const { file } = params;
	const res = await fetch(`https://data.vis4.net/dwd/stations/${file}.csv`);

	if (res) {
		return {
			body: (await res.text())
		};
	}
}