<script>
	import { navigating } from '$app/stores';
	import LoadingIndicator from './_partials/LoadingIndicator.svelte';
</script>

<h1>Ist das noch <span>Wetter</span> oder schon <span>Klimawandel</span>? {#if $navigating}
	<LoadingIndicator />
{/if}</h1>

<svelte:head>
	<title>Wetter oder Klima?</title>
	<link rel="stylesheet" type="text/css" href="/css/global.css">
</svelte:head>

<div class:navigating="{$navigating}">
	<slot></slot>
</div>


<style>
	.navigating {
		opacity: 0.5;
		pointer-events: none;
		position: relative;
	}
	.indicator {
		position: absolute;
		top: 0;
		left: 0;
	}
	span {
		color: #35bfed;
	}
	div {
		margin-bottom: 3rem;
	}
</style>