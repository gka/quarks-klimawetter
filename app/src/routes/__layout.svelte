<script>
	import { navigating } from '$app/stores';
	import LoadingIndicator from './_partials/LoadingIndicator.svelte';
</script>

<h1>Ist das noch Wetter oder schon Klima? {#if $navigating}
	<LoadingIndicator />
{/if}</h1>

<svelte:head>
	<title>Wetter oder Klima?</title>
	<link rel="stylesheet" type="text/css" href="/css/global.css">
</svelte:head>



<div class:navigating="{$navigating}">
	<slot></slot>
</div>
<hr />

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
</style>