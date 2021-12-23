/**
 * Track if we have already initialized the request interception.
 */
let interceptionInitialized = false;

/**
 * Array of mock responses.
 */
let requestMocks = [];

/**
 * Sets up mock checks and responses. Accepts a list of mock settings with the following properties:
 *
 * - `match`: function to check if a request should be mocked.
 * - `onRequestMatch`: async function to respond to the request.
 *
 * @example
 *
 * ```js
 * const MOCK_RESPONSES = [
 *   {
 *     match: isEmbedding( 'https://wordpress.org/gutenberg/handbook/' ),
 *     onRequestMatch: JSONResponse( MOCK_BAD_WORDPRESS_RESPONSE ),
 *   },
 *   {
 *     match: isEmbedding( 'https://wordpress.org/gutenberg/handbook/block-api/attributes/' ),
 *     onRequestMatch: JSONResponse( MOCK_EMBED_WORDPRESS_SUCCESS_RESPONSE ),
 *   }
 * ];
 * setUpResponseMocking( MOCK_RESPONSES );
 * ```
 *
 * If none of the mock settings match the request, the request is allowed to continue.
 *
 * @param {Array} mocks Array of mock settings.
 */
export async function setUpResponseMocking(mocks) {
	if (!interceptionInitialized) {
		// We only want to set up the request interception once, or else we get a crash
		// when we try to process the same request twice.
		interceptionInitialized = true;
		await page.setRequestInterception(true);
		page.on('request', async (request) => {
			for (let i = 0; i < requestMocks.length; i++) {
				const mock = requestMocks[i];
				if (mock.match(request)) {
					await mock.onRequestMatch(request);
					return;
				}
			}
			request.continue();
		});
	}
	// Overwrite with the passed in mocks, so we can change the mocks mid-test to test
	// recovery from scenarios where a request had failed, but is working again.
	requestMocks = [...mocks];
}
