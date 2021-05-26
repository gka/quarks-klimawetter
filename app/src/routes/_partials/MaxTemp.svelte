<script>
	import { line, area, curveBasis } from 'd3-shape';
	import { minDate, maxDate } from '$lib/stores';
    import { fmtTemp } from '$lib/formats';
    import dayjs from 'dayjs';

	export let xScale;
    export let yScale;
    export let data;
    export let context;
    export let height;

    $: curMaxTempPath = line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.TXK))
        .defined(d => !isNaN(d.TXK) && d.date <= $maxDate);

    $: contextMaxTempPath = line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.context.TXK))
        .defined(d => !isNaN(d.context.TXK))
        .curve(curveBasis);

    $: contextPath = area()
    	.x(d => xScale(d.date))
    	.y0(d => yScale(d.context.TXK_lo))
    	.y1(d => yScale(d.context.TXK_hi))
        .defined(d => !isNaN(d.context.TXK_hi))
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

    $: aboveContextPath = area()
        .x(contextPath.x())
        .y0(contextPath.y1())
        .y1(0)
        .curve(curveBasis);

    let selected;

    function select(d) {
        selected = d;
    }

    function unselect() {
        selected = undefined;
    }
</script>

<style>
    path.line {
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
    }
	.maxTemp {
		stroke-width: 2;
		stroke: var(--red);
	}
    .contextAvgMax {
        stroke-width: 1;
        stroke: #d00;
    }
	.context {
		fill: #eee;
		opacity: 0.8
	}
    circle {
        fill: var(--red);
    }
    path.hotter {
        fill: var(--red);
        opacity: 0.25;
    }
    path.colder {
        fill: var(--blue);
        opacity: 0.25;
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
    <clipPath id="clip-temp">
        <path d="{aboveMaxTempPath(data)}" />
    </clipPath>
    <clipPath id="clip-context">
        <path d="{aboveContextPath(data)}" />
    </clipPath>
</defs>


<path class="hotter" d="{belowMaxTempPath(data)}" clip-path="url(#clip-context)" />
<path class="colder" d="{belowContextPath(data)}" clip-path="url(#clip-temp)" />

<path class="context" d="{contextPath(data)}" />
<path class="line maxTemp" d="{curMaxTempPath(data)}" />
<!-- <path class="line contextAvgMax" d="{contextMaxTempPath(data)}" /> -->
{#each data as d}
    {#if !isNaN(d.TXK) && d.date <= $maxDate}
    <g on:mouseover="{() => select(d)}" on:mouseout="{unselect}" transform="translate({[xScale(d.date), yScale(d.TXK)]})">
        <circle r="15" style="opacity: 0" />
        <circle r="{selected === d ? 6 : 4}" />
    </g>
    {/if}
{/each}

{#if selected}
<g class="tooltip" transform="translate({[xScale(selected.date), yScale(selected.TXK)-33]})">
    {#each [0,1] as i}
    <text class:buffer="{i===0}">
        <tspan x="0">{dayjs(selected.date).format('D.MMM')}</tspan>
        <tspan x="0" dy="20">{fmtTemp(selected.TXK)}</tspan>
    </text>
    {/each}
</g>
{/if}