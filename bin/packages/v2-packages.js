/**
 * List of packages that use the v2 build pipeline.
 * These packages are built with bin/packages/build-v2.mjs instead of
 * the traditional Babel/webpack pipeline.
 *
 * @type {string[]}
 */
const V2_PACKAGES = [
	'a11y',
	'annotations',
	'api-fetch',
	'autop',
	'blob',
	'block-serialization-default-parser',
	'blocks',
	'components',
	'compose',
	'data',
	'data-controls',
	'date',
	'deprecated',
	'dom',
	'dom-ready',
	'element',
	'escape-html',
	'hooks',
	'html-entities',
	'i18n',
	'icons',
	'interactivity',
	'interactivity-router',
	'is-shallow-equal',
	'jest-console',
	'jest-puppeteer-axe',
	'keyboard-shortcuts',
	'keycodes',
	'media-utils',
	'notices',
	'preferences-persistence',
	'primitives',
	'priority-queue',
	'private-apis',
	'react-i18n',
	'redux-routine',
	'report-flaky-tests',
	'rich-text',
	'router',
	'shortcode',
	'style-engine',
	'sync',
	'token-list',
	'undo-manager',
	'url',
	'viewport',
	'warning',
	'wordcount',
];

module.exports = { V2_PACKAGES };
