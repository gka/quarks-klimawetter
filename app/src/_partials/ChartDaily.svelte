<script>
    import { scaleTime, scaleLinear } from 'd3-scale';
    import { extent } from 'd3-array';
    import dayjs from 'dayjs';
    import { onMount, afterUpdate, tick } from 'svelte';
    import MaxTemp from './MaxTemp.svelte';
    import Rain30Days from './Rain30Days.svelte';

    let chart;

    import { isMobile, chartWidth, minDate, maxDate } from '$lib/stores';

    $: height = $isMobile ? 450 : 400;

    export let data = [];
    export let includeZero = true;

    export let show;
    export let label = '';

    $: padding = {
        top: 50,
        right: $isMobile ? 80 : 80,
        bottom: 60,
        left: $isMobile ? 30 : 40
    };

    $: xRange = [padding.left, $chartWidth - padding.right];

    $: xScale = scaleTime()
        .domain([$minDate, dayjs($maxDate).add(14, 'day').toDate()])
        .range(xRange);

    $: yScale = scaleLinear()
        .domain(yExtent)
        .range([height - padding.bottom, padding.top]);

    $: yValues = [
        ...dataFiltered.map(d => d[show]),
        ...dataFiltered.map(d => d.context[show]),
        ...dataFiltered.map(d => d.context[show + '_lo']),
        ...dataFiltered.map(d => d.context[show + '_hi']),
        ...(includeZero ? [0] : [])
    ].filter(d => d !== undefined);

    $: yExtent = extent(yValues).map((d, i) => (show === 'temp' ? d + [-2, 0][i] : d));

    $: xTicks = xScale.ticks(Math.round(($chartWidth - padding.right - padding.left) / 40));
    $: yTicks = yScale.ticks(8);

    const midMonth = d => {
        return new Date(
            d.getTime() + (new Date(d.getFullYear(), d.getMonth() + 1, d.getDate()) - d) / 2
        );
    };

    $: formatDay = (d, i) => dayjs(d).format('D');
    $: format1 = (d, i) => dayjs(d).format('D.M.');
    $: format2 = (d, i) => {
        const fmt = [i > 0 && d.getFullYear() != xTicks[i - 1].getFullYear() ? 'YYYY' : ''].join(
            ''
        );
        return fmt ? dayjs(d).format(fmt) : '';
    };

    $: dataFiltered = data.filter((d, i) => {
        return d.date > $minDate;
    });

    onMount(async () => {
        // force re-rendering on mount
        padding.left = padding.left + 1;
        await tick();
    });
</script>

<div bind:this={chart} class="chart">
    <svg {height}>
        <defs>
            <linearGradient id="white" x1="0" x2="0" y1="0" y2="1">
                <stop class="stop1" offset="0%" />
                <stop class="stop2" offset="100%" />
            </linearGradient>
        </defs>
        <g>
            <!-- x axis -->
            <g class="axis x-axis">
                {#each xTicks as tick, i}
                    <g
                        class="tick tick-{tick}"
                        transform="translate({xScale(tick)},{height - padding.bottom})"
                    >
                        <line y1="-{height - padding.bottom}" y2="0" />
                        <text y="5">
                            {format1(tick, i)}
                        </text>

                        <text class="year" y="25">{format2(tick, i)}</text>
                    </g>
                {/each}
            </g>

            <rect fill="url(#white)" width="100%" height={padding.top + 10} />

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
            {#if label}
                <text class="label" y="5">
                    {#each label.split('\\n') as line, i}
                        <tspan x="0" dy={i ? 18 : 0}>{line}</tspan>
                    {/each}
                </text>
            {/if}

            <line class="zero" transform="translate(0,{yScale(0)})" x2="100%" />

            {#if show === 'TXK'}
                <MaxTemp width={$chartWidth} {height} {xScale} {yScale} data={dataFiltered} />
            {:else if show === 'rain30days'}
                <Rain30Days width={$chartWidth} {height} {xScale} {yScale} data={dataFiltered} />
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

    text.label {
        font-size: 1rem;
    }

    svg {
        position: relative;
        width: 100%;
        overflow: visible;
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
    .stop1 {
        stop-color: rgba(255, 255, 255, 1);
    }
    .stop2 {
        stop-color: rgba(255, 255, 255, 0);
    }
    @media (max-width: 400px) {
        .tick text {
            font-size: 13px;
        }
    }
</style>
