<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { push } from '$lib/router.svelte';

	interface Tool {
		name: string;
		description: string;
		icon: string;
		route: string;
		available: boolean;
	}

	const tools: Tool[] = [
		{
			name: 'Code Helper',
			description: 'AI-powered coding assistant for learning Python, JavaScript, and more',
			icon: '💻',
			route: '/codehelper',
			available: true
		},
		{
			name: 'LibreOffice AI',
			description: 'Create and edit documents and presentations with AI assistance',
			icon: '📄',
			route: '/libreoffice',
			available: false
		},
		{
			name: 'Blender AI',
			description: '3D modeling assistant for creating objects and scenes',
			icon: '🎨',
			route: '/blender',
			available: false
		}
	];

	function selectTool(route: string, available: boolean) {
		if (available) {
			push(route);
		}
	}
</script>

<div class="flex h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-8">
	<div class="mb-12 text-center">
		<h1 class="mb-4 text-6xl font-bold text-gray-900">SmolPC 2.0</h1>
		<p class="text-xl text-gray-600">Offline AI-Powered Educational Tools</p>
	</div>

	<div class="grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
		{#each tools as tool}
			<button
				on:click={() => selectTool(tool.route, tool.available)}
				class="text-left transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
				disabled={!tool.available}
			>
				<Card.Root class="h-full p-6">
					<div class="mb-4 text-6xl">{tool.icon}</div>
					<Card.Header class="p-0">
						<Card.Title class="mb-2 text-2xl">{tool.name}</Card.Title>
						<Card.Description class="text-base">
							{tool.description}
						</Card.Description>
					</Card.Header>
					{#if !tool.available}
						<div class="mt-4 text-sm font-semibold text-amber-600">Coming Soon</div>
					{/if}
				</Card.Root>
			</button>
		{/each}
	</div>

	<div class="mt-12 text-center text-sm text-gray-500">
		<p>All tools work 100% offline • Privacy-first • Open Source</p>
	</div>
</div>
