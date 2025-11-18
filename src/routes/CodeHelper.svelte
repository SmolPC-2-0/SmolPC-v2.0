<script lang="ts">
	import { onMount } from 'svelte';
	import { invoke } from '@tauri-apps/api/core';
	import { listen, type UnlistenFn } from '@tauri-apps/api/event';
	import Sidebar from '$lib/components/common/Sidebar.svelte';
	import ChatMessage from '$lib/components/common/ChatMessage.svelte';
	import ChatInput from '$lib/components/common/ChatInput.svelte';
	import StatusIndicator from '$lib/components/common/StatusIndicator.svelte';
	import ModelSelector from '$lib/components/codehelper/ModelSelector.svelte';
	import ContextToggle from '$lib/components/codehelper/ContextToggle.svelte';
	import QuickExamples from '$lib/components/codehelper/QuickExamples.svelte';
	import { chatsStore } from '$lib/stores/chats.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { ollamaStore } from '$lib/stores/ollama.svelte';
	import type { Message } from '$lib/types/chat';
	import type { OllamaMessage } from '$lib/types/ollama';
	import { Menu, X, Home } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { push } from '$lib/router.svelte';

	// UI State
	let isSidebarOpen = $state(true);
	let isGenerating = $state(false);
	let showQuickExamples = $state(true);
	let messagesContainer: HTMLDivElement;
	let userHasScrolledUp = $state(false);
	let cancelRequested = $state(false);
	let currentStreamingChatId = $state<string | null>(null);
	let currentStreamingMessageId = $state<string | null>(null);
	let userInteractedWithScroll = $state(false);
	let touchStartY = $state(0);

	// Derived state
	const currentChat = $derived(chatsStore.currentChat);
	const messages = $derived(currentChat?.messages ?? []);
	const hasNoChats = $derived(chatsStore.chats.length === 0);

	// Check if user is at bottom of scroll
	function isAtBottom(): boolean {
		if (!messagesContainer) return true;
		const threshold = 5;
		const distanceFromBottom =
			messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight;
		return distanceFromBottom <= threshold;
	}

	// Detect when user scrolls UP
	function handleUserScrollIntent(event: WheelEvent) {
		if (event.deltaY < 0) {
			userInteractedWithScroll = true;
			userHasScrolledUp = true;
		}
	}

	// Touch/mobile scroll detection
	function handleTouchStart(event: TouchEvent) {
		touchStartY = event.touches[0].clientY;
	}

	function handleTouchMove(event: TouchEvent) {
		const touchEndY = event.touches[0].clientY;
		if (touchEndY > touchStartY) {
			userInteractedWithScroll = true;
			userHasScrolledUp = true;
		}
	}

	function scrollToBottom() {
		if (!messagesContainer || userHasScrolledUp) return;
		messagesContainer.scrollTo({
			top: messagesContainer.scrollHeight,
			behavior: 'smooth'
		});
	}

	$effect(() => {
		if (messages.length > 0) {
			scrollToBottom();
		}
	});

	$effect(() => {
		if (messages.length === 0) {
			showQuickExamples = true;
		}
	});

	let unlistenChunk: UnlistenFn | undefined;

	async function sendMessage(content: string) {
		if (!content.trim() || isGenerating) return;

		showQuickExamples = false;
		userHasScrolledUp = false;
		userInteractedWithScroll = false;

		const currentChatId = currentChat?.id;
		if (!currentChatId) {
			console.error('No active chat');
			return;
		}

		const userMessage: Message = {
			id: crypto.randomUUID(),
			role: 'user',
			content: content.trim(),
			timestamp: Date.now()
		};

		const assistantMessage: Message = {
			id: crypto.randomUUID(),
			role: 'assistant',
			content: '',
			timestamp: Date.now()
		};

		chatsStore.addMessage(currentChatId, userMessage);
		chatsStore.addMessage(currentChatId, assistantMessage);

		isGenerating = true;
		currentStreamingChatId = currentChatId;
		currentStreamingMessageId = assistantMessage.id;
		cancelRequested = false;

		const contextMessages = settingsStore.contextEnabled
			? currentChat?.messages.slice(0, -1) || []
			: [];

		const ollamaMessages: OllamaMessage[] = [
			...contextMessages.map((msg) => ({
				role: msg.role,
				content: msg.content
			})),
			{ role: 'user', content: content.trim() }
		];

		try {
			if (unlistenChunk) {
				await unlistenChunk();
			}

			unlistenChunk = await listen<string>('ollama_chunk', (event) => {
				if (cancelRequested) return;
				if (
					currentStreamingChatId === currentChatId &&
					currentStreamingMessageId === assistantMessage.id
				) {
					chatsStore.appendToMessage(currentChatId, assistantMessage.id, event.payload);
					if (!userInteractedWithScroll) {
						scrollToBottom();
					}
				}
			});

			await invoke('generate_stream', {
				model: settingsStore.model,
				messages: ollamaMessages,
				chatId: currentChatId,
				messageId: assistantMessage.id
			});
		} catch (error) {
			console.error('Error sending message:', error);
			chatsStore.updateMessage(currentChatId, assistantMessage.id, {
				content: `Error: ${error}`
			});
		} finally {
			isGenerating = false;
			currentStreamingChatId = null;
			currentStreamingMessageId = null;
			cancelRequested = false;

			if (unlistenChunk) {
				await unlistenChunk();
				unlistenChunk = undefined;
			}
		}
	}

	async function handleCancelGeneration() {
		cancelRequested = true;
		try {
			await invoke('cancel_generation');
		} catch (error) {
			console.error('Error canceling generation:', error);
		}
		isGenerating = false;
		currentStreamingChatId = null;
		currentStreamingMessageId = null;
	}

	function handleExampleClick(prompt: string) {
		sendMessage(prompt);
	}

	onMount(() => {
		return () => {
			if (unlistenChunk) {
				unlistenChunk();
			}
		};
	});
</script>

<div class="flex h-screen flex-col bg-gradient-to-br from-slate-50 to-slate-100">
	<!-- Header -->
	<header class="flex items-center justify-between border-b bg-white/80 p-4 shadow-sm backdrop-blur-sm">
		<div class="flex items-center gap-4">
			<Button variant="ghost" size="icon" on:click={() => (isSidebarOpen = !isSidebarOpen)}>
				{#if isSidebarOpen}
					<X class="h-5 w-5" />
				{:else}
					<Menu class="h-5 w-5" />
				{/if}
			</Button>
			<Button variant="ghost" size="icon" on:click={() => push('/')} title="Back to Tool Selector">
				<Home class="h-5 w-5" />
			</Button>
			<h1 class="text-xl font-bold text-gray-800">Code Helper</h1>
		</div>

		<div class="flex items-center gap-4">
			<ModelSelector />
			<ContextToggle />
			<StatusIndicator status={ollamaStore.status} />
		</div>
	</header>

	<!-- Main Content -->
	<div class="flex flex-1 overflow-hidden">
		<!-- Sidebar -->
		{#if isSidebarOpen}
			<div class="w-64 border-r bg-white shadow-lg">
				<Sidebar />
			</div>
		{/if}

		<!-- Chat Area -->
		<div class="flex flex-1 flex-col">
			<!-- Messages -->
			<div
				bind:this={messagesContainer}
				on:wheel={handleUserScrollIntent}
				on:touchstart={handleTouchStart}
				on:touchmove={handleTouchMove}
				class="flex-1 overflow-y-auto p-6"
			>
				{#if hasNoChats}
					<div class="flex h-full items-center justify-center">
						<div class="text-center">
							<h2 class="mb-2 text-2xl font-bold text-gray-700">Welcome to Code Helper!</h2>
							<p class="text-gray-500">Create a new chat to get started</p>
						</div>
					</div>
				{:else if messages.length === 0 && showQuickExamples}
					<QuickExamples on:exampleClick={(e) => handleExampleClick(e.detail)} />
				{:else}
					{#each messages as message (message.id)}
						<ChatMessage {message} />
					{/each}
				{/if}

				{#if isGenerating && currentStreamingChatId === currentChat?.id}
					<div class="mt-4 flex items-center gap-2 text-sm text-gray-500">
						<div class="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
						<span>Generating response...</span>
						<Button size="sm" variant="outline" on:click={handleCancelGeneration}>
							Cancel
						</Button>
					</div>
				{/if}

				{#if userHasScrolledUp && !isAtBottom()}
					<button
						on:click={() => {
							userHasScrolledUp = false;
							userInteractedWithScroll = false;
							scrollToBottom();
						}}
						class="fixed bottom-24 right-8 rounded-full bg-blue-500 px-4 py-2 text-white shadow-lg transition-all hover:bg-blue-600"
					>
						↓ New messages
					</button>
				{/if}
			</div>

			<!-- Input -->
			<div class="border-t bg-white p-4">
				<ChatInput on:send={(e) => sendMessage(e.detail)} disabled={isGenerating || hasNoChats} />
			</div>
		</div>
	</div>
</div>
