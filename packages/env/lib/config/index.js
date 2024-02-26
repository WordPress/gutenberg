'use strict';
/**
 * Internal dependencies
 */
const loadConfig = require( './load-config' );
const { ValidationError } = require( './validate-config' );
const dbEnv = require( './db-env' );

/**
 * @typedef {import('./load-config').WPConfig} WPConfig
 * @typedef {import('./parse-config').WPRootConfig} WPRootConfig
 * @typedef {import('./parse-config').WPEnvironmentConfig} WPEnvironmentConfig
 * @typedef {import('./parse-source-string').WPSource} WPSource
 */

module.exports = {
	ValidationError,
	loadConfig,
	dbEnv,
};
