<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Home } from '@lucide/svelte';
	import { push } from 'svelte-spa-router';
</script>

<div class="flex h-screen flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-50">
	<Button
		variant="ghost"
		size="icon"
		class="fixed left-4 top-4"
		on:click={() => push('/')}
		title="Back to Tool Selector"
	>
		<Home class="h-5 w-5" />
	</Button>

	<div class="text-center">
		<div class="mb-6 text-8xl">📄</div>
		<h1 class="mb-4 text-4xl font-bold text-gray-900">LibreOffice AI</h1>
		<p class="mb-8 text-xl text-gray-600">Coming Soon...</p>
		<div class="rounded-lg bg-white/50 p-8 shadow-xl">
			<h2 class="mb-4 text-2xl font-semibold text-gray-800">Planned Features:</h2>
			<ul class="space-y-2 text-left text-gray-700">
				<li>✅ Create and edit Writer documents</li>
				<li>✅ Generate presentations in Impress</li>
				<li>✅ AI-powered document formatting</li>
				<li>✅ Template system</li>
				<li>✅ Voice input support</li>
				<li>✅ 36 MCP tools for document control</li>
			</ul>
		</div>
		<Button class="mt-8" on:click={() => push('/')}>Back to Tool Selector</Button>
	</div>
</div>
