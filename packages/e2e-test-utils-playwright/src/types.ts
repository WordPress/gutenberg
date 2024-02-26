/**
 * External dependencies
 */
declare global {
	interface Window {
		// Silence the warning for `window.wp` in Playwright's evaluate functions.
		wp: any;
		// Helper function added by Metrics fixture for web-vitals.js.
		__reportVitals__: ( data: string ) => void;
	}
}

export {};
