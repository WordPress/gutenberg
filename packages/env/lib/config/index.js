/**
 * Internal dependencies
 */
const { ValidationError, readConfig } = require( './config' );

/**
 * @typedef {import('./config').WPConfig} WPConfig
 * @typedef {import('./config').WPServiceConfig} WPServiceConfig
 * @typedef {import('./config').WPSource} WPSource
 */

module.exports = {
	ValidationError,
	readConfig,
};
