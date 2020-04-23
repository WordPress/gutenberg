'use strict';
/**
 * Internal dependencies
 */
const { ValidationError } = require( './config' );
const commands = require( './commands' );

module.exports = {
	...commands,
	ValidationError,
};
