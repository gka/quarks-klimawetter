<script>
    import { scaleTime, scaleLinear } from 'd3-scale';
    import dayjs from 'dayjs';
    import localizedFormat from 'dayjs/plugin/localizedFormat';
    import 'dayjs/locale/de';
    import { extent } from 'd3-array';

	import MaxTemp from './MaxTemp.svelte';
	import Rain30Days from './Rain30Days.svelte';

    dayjs.extend(localizedFormat)
    dayjs.locale('de');

	let chart;
	let chartWidth;

	import { innerWidth, minDate, maxDate } from './stores';

	$: height = Math.max(
	    450,
	    Math.min(500, chartWidth * (chartWidth > 800 ? 0.35 : chartWidth > 500 ? 0.7 : 1))
	);

	export let yScaleVar;
	export let data = [];
	export let context = [];
	export let includeZero = true;

	export let show;

	$: padding = { top: 20, right: 5, bottom: 60, left: $innerWidth < 400 ? 30 : 40 };

	$: xScale = scaleTime()
	    .domain([$minDate, $maxDate])
	    .range([padding.left, chartWidth - padding.right]);

	$: yScale = scaleLinear()
	    .domain(yExtent)
	    .range([height - padding.bottom, padding.top]);

	$: yValues = [
		...dataFiltered.map(d => d[show]),
		...dataFiltered.map(d => context[d.day][show]),
		...dataFiltered.map(d => context[d.day][show+'_05']),
		...dataFiltered.map(d => context[d.day][show+'_95']),
		...(includeZero ? [0] : [])
	].filter(d => d !== undefined);

	$: yExtent = extent(yValues);

	$: xTicks = xScale.ticks(8);
	$: yTicks = yScale.ticks(8);

	const midMonth = d => {
	    return new Date(
	        d.getTime() + (new Date(d.getFullYear(), d.getMonth() + 1, d.getDate()) - d) / 2
	    );
	};

	$: format = (d, i) => dayjs(d).format('D. MMM');
	$: formatMobile = (d, i) => d;

	$: dataFiltered = data.filter((d,i) => {
		return d.date > $minDate && d.date <= $maxDate;
	});


</script>


<svelte:window bind:innerWidth={$innerWidth} />

{@debug yExtent}

<div
    bind:this={chart}
    class="chart"
    bind:clientWidth={chartWidth}>
	<svg {height}>
		<g>
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

		    <!-- x axis -->
		    <g class="axis x-axis">
		        {#each xTicks as tick, i}
		            <g class="tick tick-{tick}" transform="translate({xScale(tick)},{height-padding.bottom})">
		                <line y1="-{height}" y2="0" />
                        <text y="5">
                            {$innerWidth > 400 ? format(tick, i) : formatMobile(tick, i)}
                        </text>
                        {#if !i || tick.getFullYear() !== xTicks[i-1].getFullYear()}
                            <text class="year" y="25">{tick.getFullYear()}</text>
                        {/if}>
		            </g>
		        {/each}
		    </g>

		    <line class="zero" transform="translate(0,{yScale(0)})" x2="100%" />

		    {#if show === 'TXK'}
		    <MaxTemp {xScale} {yScale} data={dataFiltered} {context} />
		    {:else if show === 'rain30days'}
			<Rain30Days {xScale} {yScale} data={dataFiltered} {context} />
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

	@media (max-width: 400px) {
	    .tick text {
	        font-size: 13px;
	    }
	}
</style>