// Run all tests with development tools enabled.
// eslint-disable-next-line @wordpress/wp-global-usage
globalThis.SCRIPT_DEBUG = true;

globalThis.tinyMCEPreInit = {
	baseURL: 'about:blank',
};
globalThis.userSettings = { uid: 1 };
