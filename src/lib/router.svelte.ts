// Simple hash-based router for Svelte 5 runes
export type Route = {
	path: string;
	component: any;
};

class Router {
	currentPath = $state('/');

	constructor() {
		// Listen for hash changes
		if (typeof window !== 'undefined') {
			window.addEventListener('hashchange', () => {
				this.currentPath = window.location.hash.slice(1) || '/';
			});

			// Set initial route
			this.currentPath = window.location.hash.slice(1) || '/';
		}
	}

	navigate(path: string) {
		window.location.hash = path;
	}

	get path() {
		return this.currentPath;
	}
}

export const router = new Router();

export function push(path: string) {
	router.navigate(path);
}

export function pop() {
	window.history.back();
}
