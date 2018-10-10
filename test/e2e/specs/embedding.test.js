/**
 * Internal dependencies
 */
import { clickBlockAppender, newPost } from '../support/utils';

const INTERCEPT_EMBED_SUCCESS_URLS = [
	'https://wordpress.org/gutenberg/handbook/block-api/attributes/',
	'https://www.youtube.com/watch?v=lXMskKTw3Bc',
	'https://cloudup.com/cQFlxqtY4ob',
	'https://twitter.com/notnownikki',
];

const VIDEO_URL = 'https://www.youtube.com/watch?v=lXMskKTw3Bc';

const MOCK_EMBED_RICH_SUCCESS_RESPONSE = {
	url: 'https://twitter.com/notnownikki',
	html: '<p>Mock success response.</p>',
	type: 'rich',
	provider_name: 'Twitter',
	provider_url: 'https://twitter.com',
	version: '1.0',
};

const MOCK_EMBED_VIDEO_SUCCESS_RESPONSE = {
	url: 'https://www.youtube.com/watch?v=lXMskKTw3Bc',
	html: '<iframe width="16" height="9"></iframe>',
	type: 'video',
	provider_name: 'YouTube',
	provider_url: 'https://youtube.com',
	version: '1.0',
};

const setupEmbedRequestInterception = async () => {
	// Intercept successful embed requests so that scripts loaded from third parties
	// cannot leave errors in the console and cause the test to fail.
	await page.setRequestInterception( true );
	page.on( 'request', async ( request ) => {
		const requestUrl = request.url();
		const hasEmbedSuccessUrl = INTERCEPT_EMBED_SUCCESS_URLS.some(
			( url ) => -1 !== requestUrl.indexOf( encodeURIComponent( url ) )
		);
		if ( hasEmbedSuccessUrl ) {
			// If this is the youtube request, return the video mock response that has an iframe with set aspect ratio.
			// Otherwise, use the generic rich response.
			const embedResponse = -1 !== requestUrl.indexOf( encodeURIComponent( VIDEO_URL ) ) ? MOCK_EMBED_VIDEO_SUCCESS_RESPONSE : MOCK_EMBED_RICH_SUCCESS_RESPONSE;
			request.respond( {
				content: 'application/json',
				body: JSON.stringify( embedResponse ),
			} );
		} else {
			request.continue();
		}
	} );
};

const addEmbeds = async () => {
	await newPost();

	// Valid embed
	await clickBlockAppender();
	await page.keyboard.type( '/embed' );
	await page.keyboard.press( 'Enter' );
	await page.keyboard.type( 'https://twitter.com/notnownikki' );
	await page.keyboard.press( 'Enter' );

	// Valid provider, invalid content
	await clickBlockAppender();
	await page.keyboard.type( '/embed' );
	await page.keyboard.press( 'Enter' );
	await page.keyboard.type( 'https://twitter.com/wooyaygutenberg123454312' );
	await page.keyboard.press( 'Enter' );

	// Valid provider, erroring provider API
	await clickBlockAppender();
	await page.keyboard.type( '/embed' );
	await page.keyboard.press( 'Enter' );
	await page.keyboard.type( 'https://www.reverbnation.com/collection/186-mellow-beats' );
	await page.keyboard.press( 'Enter' );

	// WordPress content that can't be embedded
	await clickBlockAppender();
	await page.keyboard.type( '/embed' );
	await page.keyboard.press( 'Enter' );
	await page.keyboard.type( 'https://wordpress.org/gutenberg/handbook/' );
	await page.keyboard.press( 'Enter' );

	// WordPress content that can be embedded
	await clickBlockAppender();
	await page.keyboard.type( '/embed' );
	await page.keyboard.press( 'Enter' );
	await page.keyboard.type( 'https://wordpress.org/gutenberg/handbook/block-api/attributes/' );
	await page.keyboard.press( 'Enter' );

	// Video content
	await clickBlockAppender();
	await page.keyboard.type( '/embed' );
	await page.keyboard.press( 'Enter' );
	await page.keyboard.type( 'https://www.youtube.com/watch?v=lXMskKTw3Bc' );
	await page.keyboard.press( 'Enter' );

	// Photo content
	await clickBlockAppender();
	await page.keyboard.type( '/embed' );
	await page.keyboard.press( 'Enter' );
	await page.keyboard.type( 'https://cloudup.com/cQFlxqtY4ob' );
	await page.keyboard.press( 'Enter' );
};

const setUp = async () => {
	await setupEmbedRequestInterception();
	await addEmbeds();
};

describe( 'embedding content', () => {
	beforeEach( setUp );

	it( 'should render embeds in the correct state', async () => {
		// The successful embeds should be in a correctly classed figure element.
		await page.waitForSelector( 'figure.wp-block-embed-twitter' );
		await page.waitForSelector( 'figure.wp-block-embed-cloudup' );
		// Video embed should also have the aspect ratio class.
		await page.waitForSelector( 'figure.wp-block-embed-youtube.wp-embed-aspect-16-9' );

		// Each failed embed should be in the edit state.
		await page.waitForSelector( 'input[value="https://twitter.com/wooyaygutenberg123454312"]' );
		await page.waitForSelector( 'input[value="https://www.reverbnation.com/collection/186-mellow-beats"]' );
		await page.waitForSelector( 'input[value="https://wordpress.org/gutenberg/handbook/"]' );
	} );
} );
