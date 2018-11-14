/**
 * Sets up mock checks and responses. Accepts a list of mock settings with the following properties:
 *   - match: function to check if a request should be mocked.
 *   - onRequestMatch: async function to respond to the request.
 *
 * Example:
 *   const MOCK_RESPONSES = [
 *     {
 *       match: isEmbedding( 'https://wordpress.org/gutenberg/handbook/' ),
 *       onRequestMatch: JSONResponse( MOCK_BAD_WORDPRESS_RESPONSE ),
 *     },
 *     {
 *       match: isEmbedding( 'https://wordpress.org/gutenberg/handbook/block-api/attributes/' ),
 *       onRequestMatch: JSONResponse( MOCK_EMBED_WORDPRESS_SUCCESS_RESPONSE ),
 *     }
 *  ];
 *  setUpResponseMocking( MOCK_RESPONSES );
 *
 * If none of the mock settings match the request, the request is allowed to continue.
 *
 * @param {Array} mocks Array of mock settings.
 */
export async function setUpResponseMocking( mocks ) {
	await page.setRequestInterception( true );
	page.on( 'request', async ( request ) => {
		for ( let i = 0; i < mocks.length; i++ ) {
			const mock = mocks[ i ];
			if ( mock.match( request ) ) {
				await mock.onRequestMatch( request );
				return;
			}
		}
		request.continue();
	} );
}
