'use strict';
/**
 * External dependencies
 */
const crypto = require( 'crypto' );

/**
 * Hashes the given string using the MD5 algorithm.
 *
 * @param {any} data The data to hash. If not a string, converted with JSON.stringify.
 * @return {string} An MD5 hash string.
 */
module.exports = function md5( data ) {
	const convertedData =
		typeof data === 'string' ? data : JSON.stringify( data );

	return crypto.createHash( 'md5' ).update( convertedData ).digest( 'hex' );
};
