<script context="module">
	/**
	 * @type {import('@sveltejs/kit').Load}
	 */
	export async function load({ page, fetch, session, context }) {
		const res = await fetch('/stationen.json');

		if (res.ok) {
			return {
				props: {
					stationen: await res.json()
				}
			};
		}

		return {
			status: res.status,
			error: new Error(`Could not load ${url}`)
		};
	}
</script>

<script>
	export let stationen;
</script>

<h1>Ist das noch Wetter oder schon Klima?</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>

<ul>
{#each stationen as station}
	<li><a href="station/{station.slug}">{station.name}</a></li>
{/each}
</ul>