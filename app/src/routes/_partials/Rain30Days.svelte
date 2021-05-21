<script>
	import { line, area, curveBasis } from 'd3-shape';
	import { minDate, maxDate } from './stores';

	export let xScale;
    export let yScale;
    export let data;
    export let context;

    $: curRainPath = line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.rain30days))
        .curve(curveBasis);

    $: contextRainPath = area()
    	.x(d => xScale(d.date))
    	.y(d => yScale(context[d.day].rain30days))
    	// .curve(curveBasis);


</script>

<style>
	.rain {
		fill: none;
		stroke: blue;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.context {
		fill: #444;
		stroke: red;
	}
</style>


<path class="context" d="{contextRainPath(data)}" />
<path class="rain" d="{curRainPath(data)}" />
