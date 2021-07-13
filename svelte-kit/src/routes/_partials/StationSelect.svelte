<script>
    import Typeahead from "svelte-typeahead";
    import fuzzy from "fuzzy";
    import { goto } from '$app/navigation';

    export let stationen = [];
    let result;

    const extract = d => d.name;

    function handleSelect(item) {
        const station = item.detail.original;
        goto(`/station/${station.slug}`);
    }
    $: hl = [
        {id: '02115', lbl: 'Helgoland'},
        {id: '01975', lbl: 'Hamburg'},
        {id: '00427', lbl: 'Berlin'},
        {id: '00722', lbl: 'Brocken'},
        {id: '02667', lbl: 'Köln'},
        {id: '01420', lbl: 'Frankfurt'},
        {id: '03379', lbl: 'München'},
    ].map(d => ({...d, ...stationen.find(e => e.id === d.id)}))
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
    data={stationen}
    {extract}
    bind:result
    on:select={handleSelect} />

<div class="small">{#each hl as station}
    <a href="/station/{station.slug}">{station.lbl}</a> &nbsp;
{/each}
</div>