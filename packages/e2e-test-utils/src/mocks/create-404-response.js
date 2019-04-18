/**
 * Respond to a request with a 404 response.
 *
 * @return {Promise} Promise that responds to a request with the mock 404 response.
 */
export function create404Response() {
	return async ( request ) => request.respond( {
		status: 404,
		contentType: 'text/plain',
		body: 'Not Found.',
	} );
}
