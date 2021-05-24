<script context="module">
    import parseStations from '$lib/parseStations';
    /**
     * @type {import('@sveltejs/kit').Load}
     */
    export async function load({ page, fetch, session, context }) {
        const res = await fetch('/data/stations.csv');

        if (res.ok) {
            return {
                props: {
                    stationen: parseStations(await res.text())
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
    import StationSelect from './_partials/StationSelect.svelte';
    import findNearestStation from '$lib/findNearestStation';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    onMount(() => {
        findNearestStation(stationen, station => {
            // console.log('found station', station);
            goto(`/station/${station.slug}`);
        })
    })

    export let stationen;
    $: sorted = stationen.sort((a,b) => a.name > b.name ? 1 : -1)
</script>

<StationSelect {stationen} />

<div style="visibility: hidden;">
    <ul>
    {#each stationen.slice(10) as station}
        <li><a href="station/{station.slug}">{station.name}</a></li>
    {/each}
    </ul>
</div>