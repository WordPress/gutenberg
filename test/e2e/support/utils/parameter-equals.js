/**
 * Creates a function to determine if a request has a parameter with a certain value.
 *
 * @param {string} parameterName The query parameter to check.
 * @param {string} value The value to check for.
 * @return {function} Function that determines if a request's query parameter is the specified value.
 */
export function parameterEquals( parameterName, value ) {
	return ( request ) => {
		const url = request.url();
		const match = new RegExp( `.*${ parameterName }=([^&]+).*` ).exec( url );
		if ( ! match ) {
			return false;
		}
		return value === decodeURIComponent( match[ 1 ] );
	};
}
