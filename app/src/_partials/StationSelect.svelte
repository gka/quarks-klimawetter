<script>
    import Typeahead from 'svelte-typeahead';
    import fuzzy from 'fuzzy';
    import { createEventDispatcher, onMount } from 'svelte';
    import { findNearestStationLL, latLonDist } from '$lib/findNearestStation';

    const dispatch = createEventDispatcher();
    // import { goto } from '$app/navigation';

    export let stations = [];
    let cities = [];
    export let active;
    export let selected;
    export let dataUrl;
    let result;

    let userSelectedCity;
    let nearestStation;

    let lookup = [];

    onMount(async () => {
        lookup = stations.slice(0);
        const res = await fetch(`${dataUrl}/cities.json`, { mode: 'cors' });
        const cities = await res.json();
        cities.forEach(city => {
            // check if we have a weather station with the same name
            const s = stations.find(
                e => e.name.toLowerCase().indexOf(city.name.toLowerCase()) >= 0
            );
            if (!s) lookup.push(city);
        });
    });

    const extract = d => d.origName || d.name;

    function select(station, userCity) {
        console.log({ station, userCity });
        nearestStation = userCity ? station : null;
        userSelectedCity = userCity;
        dispatch('select', station);
    }

    function handleSelect(item) {
        console.log('handleSelect', item.detail.original);
        let station = item.detail.original;
        if (!station.id) {
            const city = station;
            // find nearest station
            station = findNearestStationLL(stations, city.lat, city.lon);
            selected = station.name;
            return select(station, city);
        }
        return select(station);
    }
    $: hl = [
        // { id: '02115', lbl: 'Helgoland' },
        { id: '00427', lbl: 'Berlin' },
        { id: '01975', lbl: 'Hamburg' },
        // { id: '00722', lbl: 'Brocken' },
        { id: '02968', lbl: 'Köln-Stammheim' },
        { id: '01420', lbl: 'Frankfurt' },
        { id: '03379', lbl: 'München' },
        { id: '05792', lbl: 'Zugspitze' }
    ].map(d => ({ ...d, ...stations.find(e => e.id === d.id) }));
</script>

<div class="station-select">
    <Typeahead
        label="Wetterstation in deiner Region auswählen:"
        placeholder={active || ''}
        inputAfterSelect="keep"
        data={lookup}
        bind:value={selected}
        {extract}
        bind:result
        on:select={handleSelect}
    />
</div>
<div class="small">
    z.B.
    {#each hl as station}
        <a on:click|preventDefault={() => dispatch('select', station)} href="#/{station.slug}"
            >{station.lbl}</a
        > &nbsp;
    {/each}
</div>
{#if userSelectedCity}
    <p>
        In {userSelectedCity.name} gibt es leider keine Wetterstation, die lange genug Daten aufzeichnet.
        Deshalb zeigen wir die nächstgelegene Wetterstation in {nearestStation.name} an (ca. {Math.ceil(
            latLonDist(
                userSelectedCity.lat,
                userSelectedCity.lon,
                nearestStation.lat,
                nearestStation.lon
            )
        )} km Luftlinie).
    </p>
{/if}

<style>
    .station-select :global(label) {
        font-size: 1.15rem;
        font-family: sans_bold;
    }
    .small {
        font-size: 0.85rem;
        margin-bottom: 2rem;
    }
</style>
