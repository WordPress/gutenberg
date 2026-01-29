'use strict';
/**
 * Internal dependencies
 */
const start = require( './start' );
const stop = require( './stop' );
const reset = require( './reset' );
const clean = require( './clean' );
const run = require( './run' );
const destroy = require( './destroy' );
const cleanup = require( './cleanup' );
const logs = require( './logs' );
const status = require( './status' );

module.exports = {
	start,
	stop,
	reset,
	clean,
	run,
	destroy,
	cleanup,
	logs,
	status,
};
