/**
 * Given a symbol object and tag name(s), returns tag objects from the symbol
 * matching the given name.
 *
 * @param {Object}    symbol Symbol object.
 * @param {...string} names  Names of tags to return.
 *
 * @return {Object[]} Matching tag objects.
 */
function getSymbolTagsByName( symbol, ...names ) {
	return symbol.tags.filter( ( tag ) => {
		return names.some( ( name ) => name === tag.title );
	} );
}

module.exports = getSymbolTagsByName;
