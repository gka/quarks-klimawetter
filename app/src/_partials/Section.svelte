<script>
    export let gray = false;
    export let nopadding = false;
    export let wrapsSearchbox = false; // Does this section contain the search box?
</script>

<div class="wpb_wrapper">
    <div class:padtop={!nopadding} class:pargraph_grey={gray}>
        <div class="paragraph_spacing" class:wraps_searchbox={wrapsSearchbox}>
            <slot />
        </div>
    </div>
</div>

<style>
    .padtop {
        padding-top: 65px;
    }

    @media (max-width: 767.98px) {
        .paragraph_spacing.wraps_searchbox {
            padding-top: 0;
            padding-bottom: 0;
        }
        .padtop {
            padding-top: 0px;
        }
    }
</style>
