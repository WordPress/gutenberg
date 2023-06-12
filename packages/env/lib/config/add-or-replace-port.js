'use strict';
/**
 * Internal dependencies
 */
const { ValidationError } = require( './validate-config' );

/**
 * Adds or replaces the port to the given domain or URI.
 *
 * @param {string}        input     The domain or URI to operate on.
 * @param {number|string} port      The port to append.
 * @param {boolean}       [replace] Indicates whether or not the port should be replaced if one is already present. Defaults to true.
 *
 * @return {string} The string with the port added or replaced.
 */
module.exports = function addOrReplacePort( input, port, replace = true ) {
	// This matches both domains and URIs with an optional port and anything
	// that remains after. We can use this to build an output string that
	// adds or replaces the port without making any other changes to the input.
	const matches = input.match(
		/^((?:.+:\/\/)?[a-z0-9.\-]+)(?::([0-9]+))?(.*)$/i
	);
	if ( ! matches ) {
		throw new ValidationError( `Invalid domain or uri: ${ input }.` );
	}

	// When a port is already present we will do nothing if the caller doesn't want it to be replaced.
	if ( matches[ 2 ] !== undefined && ! replace ) {
		return input;
	}

	// There's never a reason to add the default ports.
	// We use == to catch both string and number ports.
	// eslint-disable-next-line eqeqeq
	if ( port == 80 || port == 443 ) {
		return input;
	}

	// Place the port in the correct location in the input.
	return matches[ 1 ] + ':' + port + matches[ 3 ];
};
