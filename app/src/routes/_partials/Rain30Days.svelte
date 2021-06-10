<script>
    import { line, area, curveBasis } from 'd3-shape';
    import { minDate, maxDate } from '$lib/stores';
    import dayjs from 'dayjs';
    import { fmtRain } from '$lib/formats';

    export let xScale;
    export let yScale;
    export let data;
    export let context;
    export let height;

    $: curRainPath = line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.rain30days))
        .defined(d => d.rain30days !== null && d.date - $maxDate < 0);

    $: contextRainPath = area()
        .x(d => xScale(d.date))
        .y(d => yScale(d.context.rain30days))
        .curve(curveBasis);

    $: aboveRainPath = area()
        .x(curRainPath.x())
        .y0(curRainPath.y())
        .y1(0)
        .defined(d => d.rain30days !== null && d.date <= $maxDate);

    $: belowRainPath = area()
        .x(curRainPath.x())
        .y0(curRainPath.y())
        .y1(height)
        .defined(d => d.rain30days !== null && d.date <= $maxDate);

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

    let selected;

    let lastContext = data[0];
    let lastRain = data.find(d => d.rain30days !== null && d.date - $maxDate < 0);

    function select(d) {
        selected = d;
    }

    function unselect() {
        selected = undefined;
    }

</script>

<style>
    path.rain {
        fill: none;
        stroke: var(--blue);
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
    }
    circle.rain {
        fill: var(--blue);
    }
    text.rain {
        fill: var(--blue);
        font-weight: bold;
        font-family: sans_bold;
        text-anchor: start;
    }
    path.context {
        fill: #444;
        stroke-width: 2;
        stroke: var(--orange);
    }
    text.context {
        font-weight: bold;
        font-family: sans_bold;
        text-anchor: start;
        fill: var(--orange);
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
    text.buffer {
        fill: white;
        stroke: white;
        stroke-width: 5;
        stroke-linecap: round;
        stroke-linejoin: round;
        opacity: 0.8;
    }
    text {
        font-size: 0.93rem;
        text-anchor: middle;
    }
    .tooltip text tspan:last-child {
        font-weight: bold;
        font-family: sans_bold;
    }
    .tooltip {
        pointer-events: none;
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
<text transform="translate({[xScale(lastContext.date)+5, yScale(lastContext.context.rain30days)+4]})" class="context">1961-1990</text>
{#if lastRain}
    <circle transform="translate({[xScale(lastRain.date), yScale(lastRain.rain30days)]})" r="4" class="rain" />
    <text transform="translate({[xScale(lastContext.date)+5, yScale(lastRain.rain30days)+4]})" class="rain">{lastRain.year}</text>
{/if}

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

{#each data as d}
    {#if d.rain30days !== null && d.date <= $maxDate}
    <g on:mouseover="{() => select(d)}" on:mouseout="{unselect}" transform="translate({[xScale(d.date), yScale(d.rain30days)]})">
        <circle r="15" style="opacity: 0" />
    </g>
    {/if}
{/each}

{#if selected}
<g class="tooltip" transform="translate({[xScale(selected.date), yScale(selected.rain30days)-30]})">
    {#each [0,1] as i}
    <text class:buffer="{i===0}">
        <tspan x="0">{dayjs(selected.date).subtract(30, 'day').format('D.M.')}-{dayjs(selected.date).format('D.M.')}</tspan>
        <tspan x="0" dy="20">{fmtRain(selected.rain30days, true)}</tspan>
    </text>
    {/each}
    <circle transform="translate(0,30)" r="6" class="rain" />
</g>
{/if}

<!-- <g class="color-key" transform="translate({[xScale(lastContext.date)-40, height-150]})">
    <rect class="more-rain" width="15" height="15" />
    <text>Mehr Regen als durchschnittlich</text>
    <g transform="translate(0, 25)">
        <rect class="less-rain" width="15" height="15" />
        <text>Weniger Regen als durchschnittlich</text>
    </g>
</g> -->