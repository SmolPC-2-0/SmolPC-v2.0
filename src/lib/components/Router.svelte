<script lang="ts">
	import type { Component } from 'svelte';
	import { router } from '$lib/router.svelte';

	interface Props {
		routes: Record<string, Component>;
	}

	let { routes }: Props = $props();

	// Get current route component
	const currentComponent = $derived(routes[router.path] || routes['/']);
</script>

{#if currentComponent}
	<currentComponent />
{:else}
	<div class="flex h-screen items-center justify-center">
		<div class="text-center">
			<h1 class="text-4xl font-bold text-gray-900">404</h1>
			<p class="text-gray-600">Page not found</p>
		</div>
	</div>
{/if}
