<script>
    import Station from './Station.svelte';
    import StationSelect from './_partials/StationSelect.svelte';
    import { findNearestStation } from '$lib/findNearestStation';
    import { csvParse } from 'd3-dsv';
    import { index } from 'd3-array';
import dayjs from 'dayjs';

    let stations;
    let station;

    // const dataUrl = 'https://data.vis4.net/dwd';
    const dataUrl = '/data';

    async function fetchJSON(url) {
        const res = await fetch(url);
        return res.json();
    }

    async function fetchCSV(url) {
        const res = await fetch(url);
        return csvParse(await res.text());
    }

    async function loadStations() {
        stations = await fetchJSON(`${dataUrl}/stations.json`);
        let match;
        if (location.hash) {
            const slug = location.hash.substr(2);
            match = stations.find(s => s.slug === slug);
            if (match) loadStation(match);
        }
        if (!location.hash || !match) {
            findNearestStation(stations, (x) => {
                loadStation(x)
            });
        }
        // listen to hash changes from here on
        window.addEventListener('hashchange', function() {
            if (station && location.hash.substr(2) !== station.hash) {
                loadStation({slug: location.hash.substr(2)});
            }
        }, false);
        return stations;
    }

    function handleStationSelect(event) {
        loadStation(event.detail);
    }

    async function loadStation(s) {
        if (!s.id) {
            s = stations.find(d => d.slug === s.slug);
        }
        const [{data, monthly}, {monthly:monthlyHist, daily}, fc] = await Promise.all([
            fetchJSON(`${dataUrl}/stations/${s.id}.json`),
            fetchJSON(`${dataUrl}/stations/${s.id}-ctx.json`)
        ]);
        s.data = data.map(d => {
            const day = dayjs(d.date).format('MM-DD');
            return {
                ...d,
                day,
                date: new Date(d.date),
                context: daily[day]
            }
        });
        s.monthlyStats = monthlyHist;
        station = s;
        console.log(s);;
        location.hash = `#/${station.slug}`
    }

    export let name;
</script>

<svelte:head>
    <title>Quarks Wetterklima</title>
</svelte:head>

<div>
    {#await loadStations()}
    <p>Loading stations</p>
    {:then stations}
    <StationSelect {stations} {dataUrl} on:select="{handleStationSelect}" />
    {/await}
    {#if station}
    <h2>{station.name}</h2>
    <Station
        stationen={stations}
        {station}
        data={station.data}
        monthlyStats={station.monthlyStats} />
    {/if}
</div>


<style>
    main {
        text-align: center;
        padding: 1em;
        max-width: 240px;
        margin: 0 auto;
    }

    h1 {
        color: #ff3e00;
        text-transform: uppercase;
        font-size: 4em;
        font-weight: 100;
    }

    @media (min-width: 640px) {
        main {
            max-width: none;
        }
    }
</style>