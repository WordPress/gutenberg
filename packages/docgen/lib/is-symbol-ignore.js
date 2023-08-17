/**
 * Internal dependencies
 */
const getSymbolTagsByName = require( './get-symbol-tags-by-name' );

/**
 * Returns true if, given a symbol object, it contains a @ignore tag, or false
 * otherwise.
 *
 * @param {Object} symbol Symbol object.
 *
 * @return {boolean} Whether symbol is private.
 */
const isSymbolIgnore = ( symbol ) =>
	getSymbolTagsByName( symbol, 'ignore' ).length > 0;

module.exports = isSymbolIgnore;
