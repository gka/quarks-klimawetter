<script>
    import { scaleLinear } from 'd3-scale';
    import { extent, range as d3range } from 'd3-array';
    import { regressionLinear } from 'd3-regression';
    import dayjs from 'dayjs';
    import { line as d3line } from 'd3-shape';
    import { afterUpdate, onMount, tick } from 'svelte';
    import { fmtTemp, fmtRain } from '$lib/formats';

    let chart;

    import { isMobile, chartWidth, minDate, maxDate } from '$lib/stores';

    export let height;
    $: height = $isMobile ? 420 : 350 + (range ? 50 : 0);

    export let month = 0;
    export let data = [];
    export let context = {};
    export let numYears = 10;
    export let includeZero = false;
    export let label = '';

    let showTrend = true;

    const now = new Date();

    $: maxYear = now.getFullYear();
    $: minYear = maxYear - numYears;

    export let show;
    export let range = false;

    $: padding = { top: 50, right: 120, bottom: 30, left: $isMobile ? 30 : 40 };

    $: xRange = [padding.left, $chartWidth - padding.right];

    $: xScale = scaleLinear().domain([minYear, maxYear]).range(xRange);

    $: yScale = scaleLinear()
        .domain(yExtent)
        .range([height - padding.bottom, padding.top]);

    $: contextShow = {
        lo: context[show + '_lo'],
        hi: context[show + '_hi']
    };

    $: yValues = [
        ...(show === 'temp' && range
            ? dataFiltered.map(d => d.temp_range[0]).concat(dataFiltered.map(d => d.temp_range[1]))
            : dataFiltered.map(d => d[show])),
        contextShow.lo,
        contextShow.hi,
        ...(includeZero ? [0] : [])
    ].filter(d => d !== undefined);

    const minTempRange = 28;
    const minprecipRange = 80;
    let yExtent = [];
    $: {
        const [min, max] = extent(yValues).map((d, i) => (show === 'temp' ? d + [0, 2][i] : d));
        yExtent = [min, Math.max(max, min + (show === 'temp' ? minTempRange : minprecipRange))];
    }

    $: xTicks = xScale.ticks(Math.round($chartWidth / 60));
    $: yTicks = yScale.ticks(7);

    let format = d => d;
    let formatMobile = d => `'${String(d).substr(2)}`;

    $: timeFormat = $isMobile ? formatMobile : format;

    $: monthDisplay = dayjs(new Date(2020, month, 1)).format('MMM');

    export let missingData;

    $: missingData = d3range(minYear, maxYear + 1).filter(
        yr => !dataFiltered.find(d => d.year === yr)
    );

    $: dataFiltered = data.filter((d, i) => {
        return (
            d.year <= maxYear &&
            d.year >= minYear &&
            (show === 'temp' ? d.temp > -900 : d.precip > -900)
        );
    });

    // exclude current year from trend
    $: dataBeforeThisYear = data.filter(d => d.year < new Date().getFullYear());
    $: regLin = regressionLinear()
        .x(d => d.year)
        .y(d => d[show])
        .domain([minYear - 1, maxYear + 1])(dataBeforeThisYear);

    export let trend;
    $: {
        trend = regLin.predict(2021) - regLin.predict(1961);
    }

    $: maxTempPath = d3line()
        .x(d => xScale(d.year))
        .y(d => yScale(d[show]));

    onMount(async () => {
        // force re-rendering on mount
        padding.left = padding.left + 1;
    });

    let selected;
    $: legendPos = isMobile
        ? [
              [0, 0],
              [0, 20],
              [0, 40]
          ]
        : [
              [show === 'temp' ? 0 : 5, 0],
              [140, 0],
              [214, 0]
          ];

    $: legendBg = $isMobile
        ? [$chartWidth - 140 - (show === 'temp' ? 0 : 5), 0, 140, 60]
        : [$chartWidth - padding.right - 200, 0, 140, 55];

    function select(d) {
        selected = d;
    }
</script>

<svelte:window />

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
                {#each d3range.apply(null, xScale.domain()) as tick, i}
                    <g
                        class="tick tick-{tick}"
                        transform="translate({xScale(tick)},{height - padding.bottom})"
                    >
                        <line y1="0" y2="4" />
                    </g>
                {/each}
                {#each xTicks as tick, i}
                    <g
                        class="tick tick-{tick}"
                        transform="translate({xScale(tick)},{height - padding.bottom})"
                    >
                        <line y1="-{height - padding.bottom}" y2="0" />
                        <text class="year" y="8">{timeFormat(tick)}</text>
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

            <line class="zero" transform="translate(0,{yScale(0)})" x2="100%" />

            {#if label}
                <text class="label" y="5">
                    {#each label.split('\\n') as line, i}
                        <tspan x="0" dy={i ? 18 : 0}>{line}</tspan>
                    {/each}
                </text>
            {/if}

            <rect
                class="context"
                y={yScale(contextShow.hi)}
                width={$chartWidth}
                height={yScale(contextShow.lo) - yScale(contextShow.hi)}
            />

            <g>
                {#each dataFiltered as d}
                    <g
                        transform="translate({[xScale(d.year), yScale(0)]})"
                        style="opacity: {!selected || selected === d ? 1 : 0.4}"
                    >
                        {#if show === 'precip'}
                            <rect
                                class="precip"
                                class:low={d[show] < contextShow.lo}
                                class:high={d[show] > contextShow.hi}
                                y={yScale(d[show]) - yScale(0)}
                                x="-4"
                                width="8"
                                height={yScale(0) - yScale(d[show])}
                            />
                        {:else if show === 'temp'}
                            {#if d[show] > 0}
                                <rect
                                    class="temp bar"
                                    class:low={d[show] < contextShow.lo}
                                    class:high={d[show] > contextShow.hi}
                                    y={yScale(d[show]) - yScale(0)}
                                    x="-4"
                                    width="8"
                                    height={yScale(0) - yScale(d[show])}
                                />
                            {:else}
                                <rect
                                    class="temp bar"
                                    class:low={d[show] < contextShow.lo}
                                    class:high={d[show] > contextShow.hi}
                                    y={0}
                                    x="-4"
                                    width="8"
                                    height={yScale(d[show]) - yScale(0)}
                                />
                            {/if}
                        {/if}
                        <rect
                            opacity="0"
                            y={-yScale(0) + padding.top}
                            on:mouseenter={() => select(d)}
                            on:mouseleave={() => select(null)}
                            class=""
                            x="-8"
                            width="16"
                            height={height - padding.top - padding.bottom}
                        />
                    </g>
                {/each}
                {#each missingData as yr}
                    <g class="missing" transform="translate({[xScale(yr), yScale(0)]})">
                        <text>*</text>
                    </g>
                {/each}
            </g>
            <!--             {#if show === 'temp'}
            <path class="temp" d="{maxTempPath(dataFiltered)}" />
            {/if} -->

            {#if showTrend}
                <path
                    class="trend"
                    d="M{[xScale(regLin[0][0]), yScale(regLin[0][1])]} L{[
                        xScale(regLin[1][0]),
                        yScale(regLin[1][1])
                    ]}"
                />
                <text
                    class="trend"
                    transform="translate({[xScale(regLin[1][0]), yScale(regLin[1][1])]})"
                >
                    <tspan x="10" class="is-bold">Trend</tspan>
                    <tspan dy="15" class="is-bold" x="10">seit 1961:</tspan>
                    <tspan class="is-bold" x="10" dy="15"
                        >{show === 'temp'
                            ? fmtTemp(trend, { forcePlus: true })
                            : fmtRain(trend, { forcePlus: true })}</tspan
                    >
                </text>
            {/if}

            <g class="legend" transform="translate({[legendBg[0], legendBg[1]]})">
                <rect
                    x="-10"
                    y="-10"
                    height={legendBg[3]}
                    width={legendBg[2]}
                    fill="white"
                    opacity="0.8"
                />
                <g transform="translate({legendPos[0]})">
                    <rect class="{show} high" width="14" height="14" />
                    <text x="18" y="12">{show === 'temp' ? 'wärmer' : 'nasser'} als normal</text>
                </g>
                <g transform="translate({legendPos[1]})">
                    <rect class={show} width="14" height="14" />
                    <text x="18" y="12">normal</text>
                </g>
                <g transform="translate({legendPos[2]})">
                    <rect class="{show} low" width="14" height="14" />
                    <text x="18" y="12">{show === 'temp' ? 'kälter' : 'trockener'} als normal</text>
                </g>
            </g>

            {#if selected}
                <g
                    class="g-tooltip"
                    transform="translate({xScale(selected.year)}, {selected[show] < 0
                        ? yScale(0) - 25
                        : yScale(selected[show]) - 25})"
                >
                    {#each [0, 1] as i}
                        <text class:buffer={i === 0}>
                            <tspan x="0"
                                >{show === 'temp'
                                    ? fmtTemp(selected[show])
                                    : fmtRain(selected[show])}</tspan
                            >
                            <tspan x="0" dy="17">{monthDisplay}</tspan>
                            <tspan>{selected.year}</tspan>
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
        font-size: 1rem;
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
        /* eslint-disable-next-line */
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
    /* circle.temp {
        fill: var(--gray);
    }
    circle.temp.high {
        fill: var(--red);
    }
    circle.temp.low {
        fill: var(--cyan);
    } */

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
        stroke: black;
        stroke-width: 2;
    }

    text.trend {
        text-anchor: start;
        font-size: 0.85rem;
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

    .boxplot {
        shape-rendering: crispEdges;
    }
    .boxplot line {
        stroke-width: 6;
    }
    .boxplot line {
        stroke: 4;
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
    .g-tooltip text {
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
    g.missing text {
        fill: var(--gray-dark);
        font-size: 14px;
        text-anchor: middle;
    }
</style>
