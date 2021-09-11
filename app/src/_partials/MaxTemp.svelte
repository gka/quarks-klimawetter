<script>
    import { line as d3line, area, curveBasis } from 'd3-shape';
    import { minDate, maxDate } from '$lib/stores';
    import { fmtTemp } from '$lib/formats';
    import dayjs from 'dayjs';

    export let xScale;
    export let yScale;
    export let data;
    export let height;

    $: curMaxTempPath = d3line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.TXK))
        .defined(d => !isNaN(d.TXK) && d.date <= $maxDate);

    $: contextMaxTempPath = d3line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.context.TXK))
        .defined(d => !isNaN(d.context.TXK))
        .curve(curveBasis);

    $: contextPath = area()
        .x(d => xScale(d.date))
        .y0(d => yScale(d.context.TXK_lo))
        .y1(d => yScale(d.context.TXK_hi))
        .defined(d => !isNaN(d.context.TXK_hi) && dayjs(d.date).diff($maxDate, 'd') < 11)
        .curve(curveBasis);

    $: aboveMaxTempPath = area()
        .x(curMaxTempPath.x())
        .y0(curMaxTempPath.y())
        .y1(0)
        .defined(d => !isNaN(d.TXK) && d.date <= $maxDate);

    $: belowMaxTempPath = area()
        .x(curMaxTempPath.x())
        .y0(curMaxTempPath.y())
        .y1(height)
        .defined(d => !isNaN(d.TXK) && d.date <= $maxDate);

    $: belowContextPath = area()
        .x(contextPath.x())
        .y0(contextPath.y0())
        .y1(height)
        .curve(curveBasis);

    $: aboveContextPath = area().x(contextPath.x()).y0(contextPath.y1()).y1(0).curve(curveBasis);

    $: inRange = data.filter(
        d => !isNaN(d.TXK) !== null && d.date >= $minDate && d.date <= $maxDate
    );

    let selected;
    $: lastContext = data.find(d => dayjs(d.date).diff($maxDate, 'd') == 10);
    $: firstDay = inRange[0];
    $: lastDay = inRange.slice(-1)[0];

    function select(d) {
        selected = d;
    }

    function unselect() {
        selected = undefined;
    }

    $: startIsWinter = [9, 10, 11, 12, 0, 1, 2].includes(firstDay.date.getMonth());
    $: endIsWinter = yScale(lastDay.TXK) > height * 0.5;
</script>

<defs>
    <clipPath id="clip-temp">
        <path d={aboveMaxTempPath(data)} />
    </clipPath>
    <clipPath id="clip-in-context">
        <path d={contextPath(data)} />
    </clipPath>
    <clipPath id="clip-above-context">
        <path d={aboveContextPath(data)} />
    </clipPath>
    <clipPath id="clip-below-context">
        <path d={belowContextPath(data)} />
    </clipPath>
</defs>

<path class="hotter" d={belowMaxTempPath(data)} clip-path="url(#clip-above-context)" />
<path class="colder" d={belowContextPath(data)} clip-path="url(#clip-temp)" />

<path class="context" d={contextPath(data)} />

<path class="line maxTemp" d={curMaxTempPath(data)} clip-path="url(#clip-in-context)" />
<!-- <path class="line maxTemp" d="{curMaxTempPath(data)}" /> -->
<path
    class="line maxTemp cur-hotter-"
    d={curMaxTempPath(data)}
    clip-path="url(#clip-above-context)"
/>
<path
    class="line maxTemp cur-colder-"
    d={curMaxTempPath(data)}
    clip-path="url(#clip-below-context)"
/>

{#if lastDay}
    <circle
        transform="translate({[xScale(lastDay.date), yScale(lastDay.TXK)]})"
        r="4"
        class:above-={lastDay.TXK > lastDay.context.TXK_hi}
        class:below-={lastDay.TXK < lastDay.context.TXK_lo}
    />
    <!-- <text transform="translate({[xScale(lastContext.date)+5, yScale(lastDay.TXK)+4]})" class="rain">{lastDay.year}</text> -->
{/if}

<!-- <path class="line contextAvgMax" d="{contextMaxTempPath(data)}" /> -->
{#each data as d}
    {#if d.TXK > d.context.TXK_records.hi[2].TXK}
        <g transform="translate({[xScale(d.date), yScale(d.TXK)]})">
            <text y="-10" class="record">R</text>
        </g>
    {/if}
    {#if !isNaN(d.TXK) && d.date <= $maxDate}
        <g
            on:mouseover={() => select(d)}
            on:mouseout={unselect}
            transform="translate({[xScale(d.date), 0]})"
        >
            <rect x="-5" width="10" {height} opacity="0" />
            <circle
                cy={yScale(d.TXK)}
                r={selected === d ? 5 : 0}
                class:above-={d.TXK > d.context.TXK_hi}
                class:below-={d.TXK < d.context.TXK_lo}
            />
        </g>
    {/if}
{/each}

{#if selected}
    <g
        class="g-tooltip"
        transform="translate({[xScale(selected.date), yScale(selected.TXK) - 43]})"
    >
        {#each [0, 1] as i}
            <text class:buffer={i === 0}>
                <tspan x="0">{fmtTemp(selected.TXK)}</tspan>
                <tspan x="0" dy="20">{dayjs(selected.date).format('D.MMM')}</tspan>
            </text>
        {/each}
    </g>
    <g
        class="g-normal"
        transform="translate({[xScale.range()[0] + 20, startIsWinter ? 70 : height - 80]})"
    >
        {#each [0, 1] as i}
            <text class:buffer={i === 0}>
                <tspan x="0">Normal am {dayjs(selected.date).format('D.MMM')}:</tspan>
                <tspan class="is-bold"
                    >{fmtTemp(selected.context.TXK_lo, true)}-{fmtTemp(
                        selected.context.TXK_hi
                    )}</tspan
                >
            </text>
        {/each}
    </g>
{:else if lastDay}
    <g
        class="last-day"
        class:above={lastDay.TXK > lastDay.context.TXK_hi}
        class:below={lastDay.TXK < lastDay.context.TXK_lo}
        transform="translate({[xScale(lastDay.date), yScale(lastDay.TXK) - 30]})"
    >
        {#each [0, 1] as i}
            <text class:buffer={i === 0}>
                <tspan x="0">{fmtTemp(lastDay.TXK)}</tspan>
                <tspan x="0" dy="17">{dayjs(lastDay.date).format('D.MMM')}</tspan>
            </text>
        {/each}
    </g>
{/if}

<g class="legend" transform="translate({[xScale($maxDate) + 20, endIsWinter ? 70 : height - 110]})">
    <rect x="-10" y="-10" height="55" width="140" fill="white" opacity="0.8" />
    <g>
        <rect class="hotter" width="15" height="15" />
        <text x="20" y="12">heißer als normal</text>
    </g>
    <g transform="translate(0,20)">
        <rect class="colder" width="15" height="15" />
        <text x="20" y="12">kälter als normal</text>
    </g>
</g>

<style>
    path.line {
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
    }
    .maxTemp {
        stroke-width: 2;
        stroke: var(--gray-dark);
    }
    .context {
        fill: #eee;
        opacity: 0.8;
    }
    /* text.context {
        font-size: 14px;
        text-anchor: start;
        fill: var(--gray-dark);
    } */
    circle {
        fill: var(--gray-dark);
    }
    /* circle.above {
        fill: var(--red);
    }
    circle.below {
        fill: var(--cyan);
    } */
    path.hotter,
    rect.hotter {
        fill: var(--red);
        opacity: 0.25;
    }
    path.colder,
    rect.colder {
        fill: var(--cyan);
        opacity: 0.25;
    }
    text.buffer {
        fill: white;
        stroke: white;
        stroke-width: 14;
        stroke-linecap: round;
        stroke-linejoin: round;
        opacity: 0.9;
    }
    /* .cur-hotter {
        stroke: var(--red);
    }
    .cur-colder {
        stroke: var(--cyan);
    }*/
    text {
        font-size: 0.93rem;
        text-anchor: middle;
    }
    text.record {
        fill: var(--red);
        font-size: 0.75rem;
        font-family: sans_bold;
    }
    .g-normal text {
        text-anchor: start;
        font-size: 14px;
        fill: var(--gray);
    }
    .last-day text {
        font-size: 0.83rem;
        fill: var(--gray-dark);
        text-anchor: start;
    }
    .last-day.above text {
        fill: var(--red);
    }
    .last-day.below text {
        fill: var(--cyan);
    }
    .last-day text tspan:first-child,
    .g-tooltip text tspan:first-child {
        font-weight: bold;
        font-family: sans_bold;
    }
    .g-tooltip {
        pointer-events: none;
    }
    .legend text {
        text-anchor: start;
        fill: var(--gray-dark);
        font-size: 14px;
    }
    .is-bold {
        font-weight: bold;
        font-family: sans_bold;
    }
</style>
