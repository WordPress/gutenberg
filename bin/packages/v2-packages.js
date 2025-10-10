/**
 * List of packages that use the v2 build pipeline.
 * These packages are built with bin/packages/build-v2.mjs instead of
 * the traditional Babel/webpack pipeline.
 *
 * @type {string[]}
 */
const V2_PACKAGES = [
	'a11y',
	'api-fetch',
	'autop',
	'blob',
	'block-serialization-default-parser',
	'date',
	'deprecated',
	'dom',
	'dom-ready',
	'element',
	'escape-html',
	'hooks',
	'html-entities',
	'i18n',
	'interactivity',
	'interactivity-router',
	'is-shallow-equal',
	'jest-console',
	'jest-puppeteer-axe',
	'keycodes',
	'preferences-persistence',
	'priority-queue',
	'private-apis',
	'redux-routine',
	'report-flaky-tests',
	'shortcode',
	'style-engine',
	'sync',
	'token-list',
	'undo-manager',
	'url',
	'warning',
	'wordcount',
];

module.exports = { V2_PACKAGES };
