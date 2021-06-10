<script>
    import { scaleTime, scaleLinear } from 'd3-scale';
    import { extent } from 'd3-array';
    import { regressionLinear } from 'd3-regression';
    import dayjs from 'dayjs';
    import { line } from 'd3-shape';
    import { beforeUpdate } from 'svelte';

    import MaxTemp from './MaxTemp.svelte';
    import Rain30Days from './Rain30Days.svelte';

    let chart;
    let chartWidth = 720;
    let clientWidth = 720;

    import { innerWidth, minDate, maxDate } from '$lib/stores';

    $: height = Math.max(
        350,
        Math.min(200, chartWidth * (chartWidth > 800 ? 0.35 : chartWidth > 500 ? 0.7 : 1))
    );

    export let yScaleVar;
    export let month = 0;
    export let data = [];
    export let context = {};
    export let numYears = 10;
    export let includeZero = false;
    export let unit = '';
    export let label = '';

    const now = new Date();

    $: maxYear = now.getFullYear() - 1;
    $: minYear = maxYear - numYears;

    export let show;
    export let range = false;

    $: padding = { top: 50, right: 105, bottom: 60, left: $innerWidth < 400 ? 30 : 40 };

    $: xScale = scaleLinear()
        .domain([minYear, maxYear])
        .range([padding.left, chartWidth - padding.right]);

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

    $: yExtent = extent(yValues).map((d,i) => show === 'temp' ? d + [-2,2][i] : d);

    $: xTicks = xScale.ticks(8);
    $: yTicks = yScale.ticks(7);


    $: format = (d, i) => dayjs(d).format('MMM');
    $: formatMobile = (d, i) => d;

    $: monthDisplay = dayjs(new Date(2020, month, 1)).format('MMM');;

    $: dataFiltered = data.filter((d,i) => {
        return d.year <= maxYear && d.year >= minYear;
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

</script>

<svelte:window bind:innerWidth={$innerWidth} />

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
            {#if show === 'precip'}
            <g transform="translate({[xScale(d.year), yScale(0)]})">
                <rect class="precip" y={yScale(d[show])-yScale(0)} x="-4" width="8" height="{yScale(0)-yScale(d[show])}" />
            </g>
            {:else if show === 'temp' && !range}
            <g transform="translate({[xScale(d.year), yScale(0)]})">
                <rect class="temp" y={yScale(d[show])-yScale(0)} x="-4" width="8" height="{yScale(0)-yScale(d[show])}" />
            </g>
            {:else if show === 'temp' && range}
            <g transform="translate({[xScale(d.year), 0]})">
                <rect class="temp" x="-1" width="2" y="{yScale(d.temp_range[1])}" height="{yScale(d.temp_range[0])-yScale(d.temp_range[1])}" />
                <rect class="temp" x="-4" width="8" y="{yScale(d.temp_hi)}" height="{yScale(d.temp_lo)-yScale(d.temp_hi)}" />
            </g>
            {/if}
            {/each}
<!--             {#if show === 'temp'}
            <path class="temp" d="{maxTempPath(dataFiltered)}" />
            {/if} -->

            <path class="trend" d="M{[xScale(regLin[0][0]), yScale(regLin[0][1])]} L{[xScale(regLin[1][0]), yScale(regLin[1][1])]}" />

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
        overflow: hidden;
    }
    text.label {
        font-size: 0.8rem;
    }
    .tick {
        font-size: 0.725em;
        font-weight: 200;
    }

    .tick line {
        stroke: var(--tick-line);
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
        fill: var(--red);
    }
    rect.precip {
        fill: var(--blue);
        opacity: 0.5;
    }

    path.trend {
        fill: none;
        stroke:  black;
        stroke-dasharray: 3,3;
    }
    path.temp {
        stroke: var(--red);
        stroke-width:  2;
        fill: none;
    }

    rect.white {
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
</style>