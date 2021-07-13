<script>
    import Typeahead from "svelte-typeahead";
    import fuzzy from "fuzzy";
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
    // import { goto } from '$app/navigation';

    export let stations = [];
    export let selected;
    let result;

    const extract = d => d.name;

    function handleSelect(item) {
        const station = item.detail.original;
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
    data={stations}
    {extract}
    bind:result
    on:select={handleSelect} />

<div class="small">{#each hl as station}
    <a on:click|preventDefault="{() => dispatch('select', station)}" href="#/{station.slug}">{station.lbl}</a> &nbsp;
{/each}
</div>