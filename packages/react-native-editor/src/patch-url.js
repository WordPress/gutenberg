/**
 * This provides a function to patch URL with a simple URL.prototype.search
 * getter - it removes any existing URL fragment, and returns the string
 * following (and including) the first '?'
 *
 * This is needed for certain middlewares used in api-fetch which process URL
 * parameters, and they are incorrectly merged when this is left unimplemented.
 *
 * @param {*} URL the URL implementation to be patched (should be imported from
 * 'react-native/Libraries/Blob/URL').
 */
export default function patchURL( URL ) {
	Object.defineProperties( URL.prototype, {
		search: {
			get() {
				const queryParameters = this._url
					.split( '#' )[ 0 ]
					.split( '?' )
					.slice( 1 )
					.join( '?' );
				return queryParameters ? `?${ queryParameters }` : '';
			},
		},
	} );

	return URL;
}
