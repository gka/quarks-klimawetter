<script>
	import { line, area, curveBasis } from 'd3-shape';
	import { minDate, maxDate } from '$lib/stores';

	export let xScale;
    export let yScale;
    export let data;
    export let context;
    export let height;

    $: curMaxTempPath = line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.TXK))
        .defined(d => !isNaN(d.TXK));

    $: contextMaxTempPath = line()
        .x(d => xScale(d.date))
        .y(d => yScale(context[d.day].TXK))
        .curve(curveBasis);

    $: contextPath = area()
    	.x(d => xScale(d.date))
    	.y0(d => yScale(context[d.day].TXK_lo))
    	.y1(d => yScale(context[d.day].TXK_hi))
    	.curve(curveBasis);

    $: aboveMaxTempPath = area()
        .x(curMaxTempPath.x())
        .y0(curMaxTempPath.y())
        .y1(0);

    $: belowMaxTempPath = area()
        .x(curMaxTempPath.x())
        .y0(curMaxTempPath.y())
        .y1(height);

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
    {#if !isNaN(d.TXK)}
    <g transform="translate({[xScale(d.date), yScale(d.TXK)]})">
        <circle r="4" />
    </g>
    {/if}
{/each}