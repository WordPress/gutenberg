/**
 * @param {string} str
 * @return {string}
 */
export function camel2hyphen( str ) {
	return str
		.replace( /[A-Z]/g, function ( match ) {
			return '-' + match.toLowerCase();
		} )
		.toLowerCase();
}
