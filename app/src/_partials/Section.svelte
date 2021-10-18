<script>
    export let gray = false;
    export let nopadding = false;
</script>

<div class="wpb_wrapper">
    <div class:padtop={!nopadding} class:pargraph_grey={gray}>
        <div class="paragraph_spacing">
            <slot />
        </div>
    </div>
</div>

<style>
    .padtop {
        padding-top: 65px;
    }

    @media (max-width: 767.98px) {
        .padtop {
            padding-top: 15px;
        }
    }
</style>
