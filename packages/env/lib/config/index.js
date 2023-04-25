/**
 * Internal dependencies
 */
const loadConfig = require( './load-config' );
const { ValidationError } = require( './validate-config' );
const dbEnv = require( './db-env' );

/**
 * @typedef {import('./parse-config').WPConfig} WPConfig
 * @typedef {import('./parse-config').WPServiceConfig} WPServiceConfig
 * @typedef {import('./parse-source-string').WPSource} WPSource
 */

module.exports = {
	ValidationError,
	loadConfig,
	dbEnv,
};
