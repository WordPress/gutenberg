'use strict';

const pkg = require( '../../../package.json' );

const REPO = 'WordPress/gutenberg';

const defaultConfig = {
	labelPrefix: '[Type]',
	skipLabel: 'no-changelog',
	defaultPrefix: 'dev',
	zenhub: false,
};
pkg.changelog = Object.assign( {}, pkg.changelog, defaultConfig );

module.exports = {
	pkg,
	REPO,
};
