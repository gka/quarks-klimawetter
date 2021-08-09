<script>
    import Typeahead from "svelte-typeahead";
    import fuzzy from "fuzzy";
    import { createEventDispatcher, onMount } from 'svelte';
    import { findNearestStationLL } from '$lib/findNearestStation';

    const dispatch = createEventDispatcher();
    // import { goto } from '$app/navigation';

    export let stations = [];
    let cities = [];
    export let selected;
    let result;

    let lookup = [];

    onMount(async () => {
        lookup = stations.slice(0);
        const res = await fetch('static/cities.json');
        const cities = await res.json();
        console.log(cities.length);
        cities.forEach(city => {
            // check if we have a weather station with the same name
            const s = stations.find(e => e.name.toLowerCase().indexOf(city.name.toLowerCase()) >= 0);
            if (!s) lookup.push(city);
        })
    });

    const extract = d => d.origName || d.name;

    function handleSelect(item) {
        let station = item.detail.original;
        if (!station.id) {
            const city = station;
            // find nearest station
            station = findNearestStationLL(stations, city.lat, city.lon)
            selected = station.name;
        }
        dispatch('select', station);
    }
    $: hl = [
        {id: '02115', lbl: 'Helgoland'},
        {id: '01975', lbl: 'Hamburg'},
        {id: '00427', lbl: 'Berlin'},
        {id: '00722', lbl: 'Brocken'},
        {id: '02667', lbl: 'Köln'},
        {id: '01420', lbl: 'Frankfurt'},
        {id: '03379', lbl: 'München'},
    ].map(d => ({...d, ...stations.find(e => e.id === d.id)}))
</script>

<style>
    .small {
        font-size: 0.85rem;
        margin-bottom: 2rem;
    }
</style>

<Typeahead
    label=""
    placeholder="Station auswählen"
    data={lookup}
    bind:value={selected}
    {extract}
    bind:result
    on:select={handleSelect}></Typeahead>

<div class="small">{#each hl as station}
    <a on:click|preventDefault="{() => dispatch('select', station)}" href="#/{station.slug}">{station.lbl}</a> &nbsp;
{/each}
</div>