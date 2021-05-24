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
        console.log('select', station)
    }
</script>

<Typeahead data={stationen} {extract} bind:result on:select={handleSelect} />
