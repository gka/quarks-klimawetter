<script>
    import { scaleTime, scaleLinear } from 'd3-scale';

	let chart;
	let chartWidth;
	let innerWidth;

	let yMin, yMax;
	let minDate, maxDate;

	$: height = Math.max(
	    450,
	    Math.min(500, chartWidth * (chartWidth > 800 ? 0.35 : chartWidth > 500 ? 0.7 : 1))
	);

	export let yScaleVar;
	export let data = [];
	export let includeZero = true;

	$: padding = { top: 20, right: 5, bottom: 30, left: innerWidth < 400 ? 30 : 40 };

	$: xScale = scaleTime()
	    .domain([minDate, maxDate])
	    .range([padding.left, chartWidth - padding.right]);

	$: yScale = scaleLinear()
	    .domain([yMin, yMax])
	    .range([height - padding.bottom, padding.top]);

	$: xTicks = xScale.ticks(8);
	$: yTicks = yScale.ticks(8);

	const midMonth = d => {
	    return new Date(
	        d.getTime() + (new Date(d.getFullYear(), d.getMonth() + 1, d.getDate()) - d) / 2
	    );
	};

	$: format = (d, i) => d;
	$: formatMobile = (d, i) => d;

</script>

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
</style>

<svelte:window bind:innerWidth={innerWidth} />

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
		            <g class="tick tick-{tick}" transform="translate({xScale(tick)},{height})">
		                <line y1="-{height}" y2="-{padding.bottom}" x1="0" x2="0" />
		                {#if midMonth(tick) < maxDate}
		                    <g transform="translate({xScale(midMonth(tick)) - xScale(tick)},-50)">
		                        <text y="0">
		                            {innerWidth > 400 ? format(tick, i) : formatMobile(tick, i)}
		                        </text>
		                        {#if (!i && tick.getMonth() < 11) || !tick.getMonth()}
		                            <text class="year" y="20">{tick.getFullYear()}</text>
		                        {/if}
		                    </g>
		                {/if}
		            </g>
		        {/each}
		    </g>

		    <line class="zero" transform="translate(0,{yScale(0)})" x2="100%" />
		</g>
	</svg>
</div>