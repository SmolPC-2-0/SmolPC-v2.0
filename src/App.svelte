<script lang="ts">
	import Router from '$lib/components/Router.svelte';
	import ToolSelector from './routes/ToolSelector.svelte';
	import CodeHelper from './routes/CodeHelper.svelte';
	import LibreOfficeAI from './routes/LibreOfficeAI.svelte';

	const routes = {
		'/': ToolSelector,
		'/codehelper': CodeHelper,
		'/libreoffice': LibreOfficeAI
	};
</script>

<Router {routes} />
