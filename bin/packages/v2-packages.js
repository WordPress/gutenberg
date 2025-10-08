/**
 * List of packages that use the v2 build pipeline.
 * These packages are built with bin/packages/build-v2.mjs instead of
 * the traditional Babel/webpack pipeline.
 *
 * @type {string[]}
 */
const V2_PACKAGES = [
	'autop',
	'blob',
	'block-serialization-default-parser',
	'deprecated',
	'dom-ready',
	'escape-html',
	'hooks',
	'html-entities',
	'i18n',
	'is-shallow-equal',
	'jest-console',
	'jest-puppeteer-axe',
	'priority-queue',
	'private-apis',
	'redux-routine',
	'report-flaky-tests',
	'shortcode',
	'style-engine',
	'token-list',
	'url',
	'warning',
	'wordcount',
];

module.exports = { V2_PACKAGES };
