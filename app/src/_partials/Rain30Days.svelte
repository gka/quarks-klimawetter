<script>
    import { line as d3line, area, curveBasis } from 'd3-shape';
    import { minDate, maxDate } from '$lib/stores';
    import dayjs from 'dayjs';
    import { fmtRain } from '$lib/formats';

    export let xScale;
    export let yScale;
    export let data;
    export let width;
    export let height;

    $: curRainPath = d3line()
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
        .y0(contextRangePath.y0())
        .y1(height)
        .curve(curveBasis);

    $: aboveContextPath = area()
        .x(contextRainPath.x())
        .y0(contextRangePath.y1())
        .y1(0)
        .curve(curveBasis);

    $: contextRangePath = area()
        .x(d => xScale(d.date))
        .y0(d => yScale(d.context.rain30days_lo))
        .y1(d => yScale(d.context.rain30days_hi))
        .defined(d => !isNaN(d.context.rain30days_hi) && dayjs(d.date).diff($maxDate, 'd') < 11)
        .curve(curveBasis);

    let selected;

    $: lastContext = data[data.length - 1]; // .find(d => dayjs(d.date).diff($maxDate, 'd') == 10);
    $: endIsVeryLow = height - yScale(lastRain.rain30days) < 130;

    $: inRange = data.filter(
        d => !isNaN(d.rain30days) !== null && d.date >= $minDate && d.date <= $maxDate,
    );

    $: firstRain = inRange[0];
    $: lastRain = inRange.slice(-1)[0];

    $: startIsLow = yScale(firstRain.rain30days) > height * 0.5;
    $: endIsLow = yScale(lastRain.rain30days) > height * 0.5;

    function select(d) {
        selected = d;
    }

    function unselect() {
        selected = undefined;
    }
</script>

<defs>
    <clipPath id="clip-rain">
        <path d={aboveRainPath(data)} />
    </clipPath>
    <clipPath id="clip-rain-above-context">
        <path d={aboveContextPath(data)} />
    </clipPath>
    <clipPath id="clip-rain-below-context">
        <path fill="black" d={belowContextPath(data)} />
    </clipPath>
    <clipPath id="clip-rain-in-context">
        <path d={contextRangePath(data)} />
    </clipPath>
</defs>

<path class="context" d={contextRangePath(data)} />

<text
    transform="translate({[
        xScale(lastContext.date) + 10,
        yScale(lastContext.context.rain30days) + 4,
    ]})"
    class="context"
>
    <tspan x="0" dy="-17">normaler</tspan>
    <tspan x="0" dy="17">Niederschlag</tspan>
    <tspan x="0" dy="17">1961-1990</tspan>
</text>

{#if lastRain}
    <circle
        transform="translate({[xScale(lastRain.date), yScale(lastRain.rain30days)]})"
        r="4"
        class="rain"
        class:above-={lastRain.rain30days > lastRain.context.rain30days_hi}
        class:below-={lastRain.rain30days < lastRain.context.rain30days_lo}
    />
    <!-- <text transform="translate({[xScale(lastContext.date)+5, yScale(lastRain.rain30days)+4]})" class="rain">{lastRain.year}</text> -->
{/if}

<path class="rain above-" d={curRainPath(data)} clip-path="url(#clip-rain-above-context)" />
<path class="rain below-" d={curRainPath(data)} clip-path="url(#clip-rain-below-context)" />
<path class="rain" d={curRainPath(data)} clip-path="url(#clip-rain-in-context)" />

<path class="more-rain" d={belowRainPath(data)} clip-path="url(#clip-rain-above-context)" />
<path class="less-rain" d={belowContextPath(data)} clip-path="url(#clip-rain)" />

<!-- {#each data as d}
    {#if d.RSK > 0 && selected && selected.date >= d.date && dayjs(selected.date).diff(d.date, 'day') < 30}
    <g transform="translate({[xScale(d.date), yScale(0)]})">
        <rect class="bar" y={yScale(d.RSK)-yScale(0)} width="4" height="{yScale(0)-yScale(d.RSK)}" />
    </g>
    {/if}
{/each} -->

{#each data as d}
    {#if d.rain30days !== null && d.date <= $maxDate}
        <g
            on:mouseover={() => select(d)}
            on:mouseout={unselect}
            transform="translate({[xScale(d.date), 0]})"
        >
            <rect x="-5" width="10" {height} opacity="0" />
        </g>
    {/if}
{/each}

{#if selected}
    <g
        class="g-tooltip"
        transform="translate({[xScale(selected.date), yScale(selected.rain30days) - 30]})"
    >
        {#each [0, 1] as i}
            <text class:buffer={i === 0}>
                <tspan x="0">{fmtRain(selected.rain30days)}</tspan>
                <tspan x="0" dy="20"
                    >{dayjs(selected.date).subtract(30, 'day').format('D.M.')}-{dayjs(
                        selected.date,
                    ).format('D.M.')}</tspan
                >
            </text>
        {/each}
        <circle
            transform="translate(0,30)"
            r="5"
            class="rain"
            class:above-={selected.rain30days > selected.context.rain30days_hi}
            class:below-={selected.rain30days < selected.context.rain30days_lo}
        />
    </g>
    <g
        class="g-normal"
        transform="translate({[xScale.range()[0] + 20, startIsLow ? 70 : height - 90]})"
    >
        {#each [0, 1] as i}
            <text class:buffer={i === 0}>
                <tspan x="0"
                    >Normal zwischen {dayjs(selected.date).subtract(30, 'day').format('D.M.')} und {dayjs(
                        selected.date,
                    ).format('D.M.')}:<tspan>
                        <tspan x="0" y="15" class="is-bold"
                            >{fmtRain(selected.context.rain30days_lo)}-{fmtRain(
                                selected.context.rain30days_hi,
                            )}</tspan
                        >
                    </tspan></tspan
                ></text
            >
        {/each}
    </g>
{:else}
    <g
        class="last-day"
        class:above={lastRain.rain30days > lastRain.context.rain30days_hi}
        class:below={lastRain.rain30days < lastRain.context.rain30days_lo}
        transform="translate({[
            xScale(lastRain.date),
            !endIsLow || endIsVeryLow
                ? yScale(Math.max(lastRain.rain30days, lastRain.context.rain30days_hi)) - 28
                : yScale(Math.min(lastRain.rain30days, lastRain.context.rain30days_lo)) + 28,
        ]})"
    >
        {#each [0, 1] as i}
            <text class:buffer={i === 0}>
                <tspan x="-4">{fmtRain(lastRain.rain30days)}</tspan>
                <tspan x="-4" dy="17"
                    >{dayjs(lastRain.date).subtract(30, 'day').format('D.M.')}-{dayjs(
                        lastRain.date,
                    ).format('D.M.')}</tspan
                >
            </text>
        {/each}
        {#if (lastRain.rain30days < lastRain.context.rain30days_hi && lastRain.rain30days > lastRain.context.rain30days_lo) || endIsVeryLow}
            <line
                style="stroke:black; opacity:0.5"
                y1={!endIsLow || endIsVeryLow ? 25 : -15}
                y2={!endIsLow || endIsVeryLow
                    ? yScale(lastRain.rain30days) - yScale(lastRain.context.rain30days_hi) + 28
                    : yScale(lastRain.rain30days) - yScale(lastRain.context.rain30days_lo) - 28}
            />
        {/if}
    </g>
{/if}

<g class="legend" transform="translate({[width - 180, endIsLow ? 40 : height - 130]})">
    <rect x="-10" y="-10" height="55" width="190" fill="white" opacity="0.8" />
    <g>
        <rect class="more-rain" width="15" height="15" />
        <text x="20" y="12">mehr Regen als normal</text>
    </g>
    <g transform="translate(0,20)">
        <rect class="less-rain" width="15" height="15" />
        <text x="20" y="12">weniger Regen als normal</text>
    </g>
    <g transform="translate(0,40)">
        <rect class="context" width="15" height="15" />
        <text x="20" y="12">normal</text>
    </g>
</g>

<style>
    path.rain {
        fill: none;
        stroke: var(--gray-dark);
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
    }
    /* path.rain.above {
        stroke: var(--blue);
    }
    path.rain.below {
        stroke: var(--orange);
    } */
    circle.rain {
        fill: var(--gray-dark);
    }
    circle.rain.above {
        fill: var(--blue);
    }
    circle.rain.below {
        fill: var(--orange);
    }
    text.context {
        font-size: 14px;
        text-anchor: start;
        fill: var(--gray);
        font-family: sans_bold;
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
        stroke-width: 14;
        stroke-linecap: round;
        stroke-linejoin: round;
        opacity: 0.9;
    }

    .context {
        fill: #eee;
        opacity: 0.8;
    }
    text {
        font-size: 0.93rem;
        text-anchor: middle;
    }
    .g-normal text {
        text-anchor: start;
        fill: var(--gray);
        font-size: 14px;
    }
    .g-tooltip,
    .last-day text tspan:first-child {
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
    .last-day text {
        font-size: 0.83rem;
        fill: var(--gray-dark);
        text-anchor: start;
    }
    .last-day.above text {
        fill: var(--blue);
    }
    .last-day.below text {
        fill: var(--orange);
    }
</style>
