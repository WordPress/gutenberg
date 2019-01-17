module.exports = function( token ) {
	if ( token.declaration === null &&
		token.specifiers !== null &&
		token.specifiers.length > 0 &&
		token.source !== null ) {
		return true;
	}
};
