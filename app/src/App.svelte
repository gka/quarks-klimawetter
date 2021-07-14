<script>
    import Station from './Station.svelte';
    import StationSelect from './_partials/StationSelect.svelte';
    import findNearestStation from '$lib/findNearestStation';
    import { csvParse } from 'd3-dsv';
    import { index } from 'd3-array';

    let stations;
    let station;

    const dataUrl = 'https://data.vis4.net/dwd';

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
        if (location.hash) {
            const slug = location.hash.substr(2);
            const match = stations.find(s => s.slug === slug);
            if (match) loadStation(match);
            else {
                findNearestStation(stations, (x) => {
                    loadStation(x)
                });
            }
        }
        // listen to hash changes from here on
        window.addEventListener('hashchange', function() {
            if (station && location.hash.substr(2) !== station.hash) {
                console.log('The hash has changed!', location.hash);
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
            console.log(s);
            s = stations.find(d => d.slug === s.slug);
        }
        const [{data, monthlyStats}, context, fc] = await Promise.all([
            fetchJSON(`${dataUrl}/stations/${s.id}.json`),
            fetchJSON(`${dataUrl}/stations/${s.id}-ctx.json`),
            fetchCSV(`${dataUrl}/stations/${s.id}-fc.csv`),
        ]);
        const fcMap = index(fc, d => d.date);
        console.log(fcMap);
        s.data = data.map(d => ({
            ...d,
            date: new Date(d.date),
            TXK: d.TXK === null && fcMap.has(d.date) ? +(fcMap.get(d.date)).TXK : d.TXK,
            context: context[d.day]
        }))
        s.monthlyStats = monthlyStats;
        station = s;
        console.log('station loaded', station)
        location.hash = `#/${station.slug}`
    }

    export let name;
</script>

<div>
    <p>Ist es heute nicht viel zu warm? Regnet es wirklich immer so viel? Hier kannst du nachschauen, ob das aktuelle Wetter in deiner Region noch normal ist oder durch den Klimawandel kommt.</p>
    {#await loadStations()}
    <p>Loading stations</p>
    {:then stations}
    <StationSelect {stations} on:select="{handleStationSelect}" />
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