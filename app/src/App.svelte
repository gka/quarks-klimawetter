<script>
    import Station from './Station.svelte';
    import StationSelect from './_partials/StationSelect.svelte';
    import TimeControls from './_partials/TimeControls.svelte';
    import { findNearestStation } from '$lib/findNearestStation';
    import dayjs from 'dayjs';

    let stations;
    let station;

    let selected;

    const dataUrl = 'https://data.vis4.net/dwd';
    // const dataUrl = 'https://data.wdr.de/quarks-klima-wetter/data';
    // const dataUrl = '/data';

    async function fetchJSON(url) {
        const res = await fetch(url, { mode: 'cors' });
        return res.json();
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
            findNearestStation(stations, x => {
                loadStation(x);
            });
        }
        // listen to hash changes from here on
        window.addEventListener(
            'hashchange',
            function () {
                if (station && location.hash.substr(2) !== station.hash) {
                    loadStation({ slug: location.hash.substr(2) });
                }
            },
            false
        );
        return stations;
    }

    function handleStationSelect(event) {
        loadStation(event.detail);
    }

    async function loadStation(s) {
        if (!s.id) {
            s = stations.find(d => d.slug === s.slug);
        }
        const [{ data, monthly }, { monthly: monthlyHist, daily }, fc] = await Promise.all([
            fetchJSON(`${dataUrl}/stations/${s.id}.json`),
            fetchJSON(`${dataUrl}/stations/${s.id}-ctx.json`)
        ]);
        s.data = data
            .map(d => {
                const day = dayjs(d.date).format('MM-DD');
                return {
                    ...d,
                    day,
                    date: new Date(d.date),
                    context: daily[day]
                };
            })
            .reverse();
        station = s;
        monthly.forEach(m => {
            // check if that month is already in monthlyStat
            if (monthlyHist[m.month - 1].stats.slice(-1)[0].year < m.year) {
                monthlyHist[m.month - 1].stats.push(m);
            }
        });
        s.monthlyStats = monthlyHist;
        selected = station.name;
        location.hash = `#/${station.slug}`;
    }
</script>

<svelte:head>
    <title>Quarks Wetterklima</title>
</svelte:head>

<TimeControls />
<div>
    {#await loadStations()}
        <p>Loading stations</p>
    {:then stations}
        <StationSelect
            bind:active={selected}
            {stations}
            {dataUrl}
            on:select={handleStationSelect}
        />
    {/await}
    {#if station}
        <Station
            stationen={stations}
            {station}
            data={station.data}
            monthlyStats={station.monthlyStats}
        />
    {/if}
</div>
