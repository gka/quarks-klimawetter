<script>
    import { scaleTime, scaleLinear } from 'd3-scale';
    import { extent } from 'd3-array';
    import { regressionLinear } from 'd3-regression';
    import dayjs from 'dayjs';
    import { line } from 'd3-shape';
    import { beforeUpdate, onMount, tick } from 'svelte';
    import { fmtTemp, fmtRain } from '$lib/formats';

    import MaxTemp from './MaxTemp.svelte';
    import Rain30Days from './Rain30Days.svelte';

    let chart;
    let chartWidth = 720;
    let clientWidth = 720;

    import { innerWidth, minDate, maxDate } from '$lib/stores';

    $: height = Math.max(
        350,
        Math.min(200, chartWidth * (chartWidth > 800 ? 0.35 : chartWidth > 500 ? 0.7 : 1))
    ) + (range ? 50 : 0);

    export let yScaleVar;
    export let month = 0;
    export let data = [];
    export let context = {};
    export let numYears = 10;
    export let includeZero = false;
    export let unit = '';
    export let label = '';

    let showTrend = false;

    const now = new Date();

    $: maxYear = now.getFullYear();
    $: minYear = maxYear - numYears;

    export let show;
    export let range = false;

    $: padding = { top: 50, right: 80, bottom: 30, left: $innerWidth < 400 ? 30 : 40 };

    $: xRange = [padding.left, chartWidth - padding.right];

    $: xScale = scaleLinear()
        .domain([minYear, maxYear])
        .range(xRange);

    $: yScale = scaleLinear()
        .domain(yExtent)
        .range([height - padding.bottom, padding.top]);

    $: contextShow = {
        lo: context[show+'_lo'],
        hi: context[show+'_hi'],
    };

    $: yValues = [
        ...(show === 'temp' && range ?
            dataFiltered.map(d => d.temp_range[0])
                .concat(dataFiltered.map(d => d.temp_range[1])) :
            dataFiltered.map(d => d[show])),
        contextShow.lo,
        contextShow.hi,
        ...(includeZero ? [0] : [])
    ].filter(d => d !== undefined);

    const minTempRange = 28;
    const minprecipRange = 80;
    let yExtent = [];
    $: {
        const [min,max] = extent(yValues).map((d,i) => show === 'temp' ? d + [-2,2][i] : d);
        yExtent = [min, Math.max(max, min+(show === 'temp' ? minTempRange : minprecipRange))];
    }

    $: xTicks = xScale.ticks(chartWidth / 60);
    $: yTicks = yScale.ticks(7);


    $: format = (d, i) => dayjs(d).format('MMM');
    $: formatMobile = (d, i) => d;

    $: monthDisplay = dayjs(new Date(2020, month, 1)).format('MMM');;

    $: dataFiltered = data.filter((d,i) => {
        return d.year <= maxYear && d.year >= minYear && (show === 'temp' ? d.temp > -900 : d.precip > -900);
    });

    $: regLin = regressionLinear()
        .x(d => d.year)
        .y(d => d[show])
        .domain([minYear-1, maxYear+1])(data);

    $: maxTempPath = line()
        .x(d => xScale(d.year))
        .y(d => yScale(d[show]));

    beforeUpdate(() => {
        if (clientWidth && clientWidth !== chartWidth) {
            chartWidth = clientWidth;
        }
    })

    onMount(async () => {
        // force re-rendering on mount
        padding.left = padding.left+1;
        await tick();
        chartWidth = chartWidth-1;
    });;

    let selected;

    function select(d) {
        selected = d;
    }

</script>

<svelte:window bind:innerWidth={$innerWidth} />
<div style="text-align: right; position: relative; top: -10px">
    <label><input type="checkbox" bind:checked="{showTrend}"> zeige langjährigen Trend</label>
</div>
<div
    bind:this={chart}
    class="chart"
    bind:clientWidth={clientWidth}>
    <svg {height}>
        <defs>
            <linearGradient id="white" x1="0" x2="0" y1="0" y2="1">
                <stop class="stop1" offset="0%"/>
                <stop class="stop2" offset="100%"/>
            </linearGradient>
        </defs>
        <g>

            <!-- x axis -->
            <g class="axis x-axis">
                {#each xTicks as tick, i}
                    <g class="tick tick-{tick}" transform="translate({xScale(tick)},{height-padding.bottom})">
                        <line y1="-{height-padding.bottom}" y2="0" />
          <!--               <text y="5">
                            {monthDisplay}
                        </text> -->
                        <text class="year" y="5">{tick}</text>
                    </g>
                {/each}
            </g>
            <rect fill="url(#white)" width="100%" height="{padding.top+10}"></rect>

            <!-- y axis -->
            <g class="axis y-axis">
                {#each yTicks as tick, i}
                    <g class="tick tick-{tick}" transform="translate(0, {yScale(tick)})">
                        <line x2="100%" />
                        <text y="-4">
                            {@html tick}
                        </text>
                    </g>
                {/each}
            </g>

            <line class="zero" transform="translate(0,{yScale(0)})" x2="100%" />

            {#if label}
            <text class="label" y="10">
                {#each label.split('\\n') as line,i}
                <tspan x="0" dy="{i?14:0}">{line}</tspan>
                {/each}
            </text>
            {/if}

            <rect class="context" y={yScale(contextShow.hi)} width="{chartWidth}" height="{yScale(contextShow.lo)-yScale(contextShow.hi)}" />

            {#each dataFiltered as d}
            <g transform="translate({[xScale(d.year), yScale(0)]})" style="opacity: {!selected || selected === d ? 1 : 0.4}">
                {#if show === 'precip'}
                <rect class="precip" class:low="{d[show] < contextShow.lo}" class:high="{d[show] > contextShow.hi}" y={yScale(d[show])-yScale(0)} x="-4" width="8" height="{yScale(0)-yScale(d[show])}" />

                {:else if show === 'temp'}
                    {#if d[show] > 0}
                    <rect class="temp bar" class:low="{d[show] < contextShow.lo}" class:high="{d[show] > contextShow.hi}" y={yScale(d[show])-yScale(0)} x="-4" width="8" height="{yScale(0)-yScale(d[show])}" />
                    {:else}
                    <rect class="temp bar" class:low="{d[show] < contextShow.lo}" class:high="{d[show] > contextShow.hi}" y={0} x="-4" width="8" height="{yScale(d[show])-yScale(0)}" />
                    {/if}
                {/if}
                <rect opacity="0" y="{-yScale(0)+padding.top}" on:mouseenter="{() => select(d)}" on:mouseleave="{() => select(null)}" class="" x="-8" width="16" height="{height-padding.top-padding.bottom}" />
            </g>
            {/each}

<!--             {#if show === 'temp'}
            <path class="temp" d="{maxTempPath(dataFiltered)}" />
            {/if} -->

            {#if showTrend}
            <path class="trend" d="M{[xScale(regLin[0][0]), yScale(regLin[0][1])]} L{[xScale(regLin[1][0]), yScale(regLin[1][1])]}" />
            {/if}

            <g class="legend" transform="translate({[xScale(2021)-200-padding.right, 0]})">
                <rect x="-10" y="-10" height="55" width="140" fill="white" opacity="0.8" />
                <g transform="translate({show === 'temp' ? 0 : 5},0)">
                    <rect class="{show} high" width="14" height="14" />
                    <text x="18" y="12">{show === 'temp' ? 'wärmer' : 'nasser'} als normal</text>
                </g>
                <g transform="translate(140,0)">
                    <rect class="{show}" width="14" height="14" />
                    <text x="18" y="12">normal</text>
                </g>
                <g transform="translate(214,0)">
                    <rect class="{show} low" width="14" height="14" />
                    <text x="18" y="12">{show === 'temp' ? 'kälter' : 'trockener'} als normal</text>
                </g>
            </g>


            {#if selected}
            <g class="g-tooltip" transform="translate({xScale(selected.year)}, {selected[show] < 0 ? yScale(0)-25 : yScale(selected[show])-25})">
                {#each [0,1] as i}
                <text class:buffer="{i===0}">
                    <tspan x="0">{show === 'temp' ? fmtTemp(selected[show]) : fmtRain(selected[show], true) }</tspan>
                    <tspan x="0" dy="17">{monthDisplay}</tspan>
                    <tspan >{selected.year}</tspan>
                </text>
                {/each}
            </g>
            {/if}

        </g>
    </svg>
</div>


<style>
    .chart {
        width: 100%;
        margin-left: auto;
        margin-right: auto;
    }

    svg {
        position: relative;
        width: 100%;
        overflow: visible;
    }
    text.label {
        font-size: 0.8rem;
    }
    label {
        color: var(--gray-dark);
        font-size: 14px;
    }
    .tick {
        font-size: 0.725em;
        font-weight: 200;
    }

    .tick line {
        stroke: #dedede;
        shape-rendering: crispEdges;
    }

    .tick text {
        fill: #666;
        font-weight: 500;
        font-size: 15px;
        text-anchor: start;
    }

    .x-axis .tick text {
        text-anchor: middle;
        dominant-baseline: hanging;
    }

    line.zero {
        shape-rendering: crispEdges;
        stroke: black;
        opacity: 0.25;
    }

    rect.context {
        opacity: 0.06;
    }

    rect.temp {
        fill: var(--gray);
    }
    rect.temp.bar {
        opacity: 0.7;
    }
    rect.temp.high {
        fill: var(--red);
    }
    rect.temp.low {
        fill: var(--cyan);
    }
    circle.temp {
        fill: var(--gray);
    }
    circle.temp.high {
        fill: var(--red);
    }
    circle.temp.low {
        fill: var(--cyan);
    }

    rect.precip {
        fill: var(--gray);
        opacity: 0.7;
    }
    rect.precip.high {
        fill: var(--blue);
    }
    rect.precip.low {
        fill: var(--orange);
    }


    path.trend {
        fill: none;
        stroke:  black;
        stroke-dasharray: 3,3;
    }

    .stop1 {
        stop-color: rgba(255,255,255,1);
    }
    .stop2 {
        stop-color: rgba(255,255,255,0);
    }

    @media (max-width: 400px) {
        .tick text {
            font-size: 13px;
        }
    }

    .boxplot {
        shape-rendering: crispEdges;

    }
    .boxplot line {
        stroke-width: 6;
    }
    .boxplot line {
        stroke:  4;
        stroke: var(--gray);
    }

    .legend text {
        text-anchor: start;
        fill: var(--gray-dark);
        font-size: 14px;
    }
    .legend g rect {
        opacity: 0.7;
    }
    .g-tooltip text{
        text-anchor: middle;
        font-size: 0.93rem;
    }
    text.buffer {
        fill: white;
        stroke: white;
        stroke-width: 5;
        stroke-linecap: round;
        stroke-linejoin: round;
        opacity: 0.8;
    }

    .g-tooltip text tspan:first-child {
        font-weight: bold;
        font-family: sans_bold;
    }
    .g-tooltip {
        pointer-events: none;
    }
</style>