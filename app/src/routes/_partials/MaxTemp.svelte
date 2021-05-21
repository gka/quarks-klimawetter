<script>
	import { line, area, curveBasis } from 'd3-shape';
	import { minDate, maxDate } from './stores';

	export let xScale;
    export let yScale;
    export let data;
    export let context;

    $: curMaxTempPath = line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.TXK))
        .curve(curveBasis);

    $: contextMaxTempPath = line()
        .x(d => xScale(d.date))
        .y(d => yScale(context[d.day].TXK))
        .curve(curveBasis);

    $: contextPath = area()
    	.x(d => xScale(d.date))
    	.y0(d => yScale(context[d.day].TXK_05))
    	.y1(d => yScale(context[d.day].TXK_95))
    	// .curve(curveBasis);
</script>

<style>
    path.line {
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
    }
	.maxTemp {
		stroke-width: 2;
		stroke: #d00;
	}
    .contextAvgMax {
        stroke-width: 1;
        stroke: #d00;
    }
	.context {
		fill: #444;
		opacity: 0.1
	}
</style>

<path class="context" d="{contextPath(data)}" />
<path class="line maxTemp" d="{curMaxTempPath(data)}" />
<path class="line contextAvgMax" d="{contextMaxTempPath(data)}" />
