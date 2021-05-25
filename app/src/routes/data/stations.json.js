/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export async function get({ params }) {
	const res = await fetch('https://data.vis4.net/dwd/stations.json');

	if (res) {
		return {
			body: (await res.text())
		};
	}
}