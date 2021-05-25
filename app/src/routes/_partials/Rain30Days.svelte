<script>
    import { line, area, curveBasis } from 'd3-shape';
    import { minDate, maxDate } from '$lib/stores';

    export let xScale;
    export let yScale;
    export let data;
    export let context;
    export let height;

    $: curRainPath = line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.rain30days));

    $: contextRainPath = area()
        .x(d => xScale(d.date))
        .y(d => yScale(context[d.day].rain30days))
        .curve(curveBasis);

    $: aboveRainPath = area()
        .x(curRainPath.x())
        .y0(curRainPath.y())
        .y1(0);

    $: belowRainPath = area()
        .x(curRainPath.x())
        .y0(curRainPath.y())
        .y1(height);

    $: belowContextPath = area()
        .x(contextRainPath.x())
        .y0(contextRainPath.y())
        .y1(height)
        .curve(curveBasis);

    $: aboveContextPath = area()
        .x(contextRainPath.x())
        .y0(contextRainPath.y())
        .y1(0)
        .curve(curveBasis);

</script>

<style>
    .rain {
        fill: none;
        stroke: var(--blue);
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
    }
    .context {
        fill: #444;
        stroke-width: 2;
        stroke: var(--orange);
    }
    rect {
        fill: var(--blue);
        opacity: 0.5;
    }
    .more-rain {
        fill: var(--blue);
        opacity: 0.3;
    }
    .less-rain {
        fill: var(--orange);
        opacity: 0.3;
    }
</style>

<defs>
    <clipPath id="clip-rain">
        <path d="{aboveRainPath(data)}" />
    </clipPath>
    <clipPath id="clip-context-rain">
        <path d="{aboveContextPath(data)}" />
    </clipPath>
</defs>

<path class="context" d="{contextRainPath(data)}" />
<path class="rain" d="{curRainPath(data)}" />

<path class="more-rain" d="{belowRainPath(data)}" clip-path="url(#clip-context-rain)" />
<path class="less-rain" d="{belowContextPath(data)}" clip-path="url(#clip-rain)" />

{#each data as d}
    {#if d.RSK > 0}
    <g transform="translate({[xScale(d.date), yScale(0)]})">
        <rect y={yScale(d.RSK)-yScale(0)} width="4" height="{yScale(0)-yScale(d.RSK)}" />
    </g>
    {/if}
{/each}