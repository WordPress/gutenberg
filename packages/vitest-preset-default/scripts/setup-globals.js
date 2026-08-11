// Run all tests with development tools enabled.
// eslint-disable-next-line @wordpress/wp-global-usage
globalThis.SCRIPT_DEBUG = true;

if ( typeof globalThis.window !== 'undefined' ) {
	globalThis.window.tinyMCEPreInit = {
		baseURL: 'about:blank',
	};
	globalThis.window.userSettings = { uid: 1 };
}
