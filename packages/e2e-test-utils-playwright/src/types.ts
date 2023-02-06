declare global {
	interface Window {
		// Silence the warning for `window.wp` in Playwright's evaluate functions.
		wp: any;
	}
}

export {};
