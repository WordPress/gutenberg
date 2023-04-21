'use strict';
/**
 * Internal dependencies
 */
const commands = require( './commands' );
const { ValidationError } = require( './config' );
const { PostInstallError } = require( './wordpress' );

module.exports = {
	...commands,
	ValidationError,
	PostInstallError,
};
