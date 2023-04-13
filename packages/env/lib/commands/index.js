/**
 * Internal dependencies
 */
const start = require( './start' );
const stop = require( './stop' );
const clean = require( './clean' );
const run = require( './run' );
const destroy = require( './destroy' );
const logs = require( './logs' );
const installPath = require( './install-path' );

module.exports = {
	start,
	stop,
	clean,
	run,
	destroy,
	logs,
	installPath,
};
