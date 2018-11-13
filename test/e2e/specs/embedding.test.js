/**
 * Internal dependencies
 */
import {
	clickBlockAppender,
	newPost,
	isEmbedding,
	setUpResponseMocking,
	JSONResponse,
	pressWithModifier,
	META_KEY,
} from '../support/utils';

const MOCK_EMBED_WORDPRESS_SUCCESS_RESPONSE = {
	url: 'https://wordpress.org/gutenberg/handbook/block-api/attributes/',
	html: '<div class="wp-embedded-content" data-secret="shhhh it is a secret">WordPress embed</div>',
	type: 'rich',
	provider_name: 'WordPress',
	provider_url: 'https://wordpress.org',
	version: '1.0',
};

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

const MOCK_BAD_EMBED_PROVIDER_RESPONSE = {
	url: 'https://twitter.com/thatbunty',
	html: false,
	provider_name: 'Embed Provider',
	version: '1.0',
};

const MOCK_CANT_EMBED_RESPONSE = {
	provider_name: 'Embed Handler',
	html: '<a href="https://twitter.com/wooyaygutenberg123454312">https://twitter.com/wooyaygutenberg123454312</a>',
};

const MOCK_BAD_WORDPRESS_RESPONSE = {
	code: 'oembed_invalid_url',
	message: 'Not Found',
	data: {
		status: 404,
	},
	html: false,
};

const MOCK_RESPONSES = [
	{
		match: isEmbedding( 'https://wordpress.org/gutenberg/handbook/' ),
		onRequestMatch: JSONResponse( MOCK_BAD_WORDPRESS_RESPONSE ),
	},
	{
		match: isEmbedding( 'https://wordpress.org/gutenberg/handbook/block-api/attributes/' ),
		onRequestMatch: JSONResponse( MOCK_EMBED_WORDPRESS_SUCCESS_RESPONSE ),
	},
	{
		match: isEmbedding( 'https://www.youtube.com/watch?v=lXMskKTw3Bc' ),
		onRequestMatch: JSONResponse( MOCK_EMBED_VIDEO_SUCCESS_RESPONSE ),
	},
	{
		match: isEmbedding( 'https://cloudup.com/cQFlxqtY4ob' ),
		onRequestMatch: JSONResponse( MOCK_EMBED_RICH_SUCCESS_RESPONSE ),
	},
	{
		match: isEmbedding( 'https://twitter.com/notnownikki' ),
		onRequestMatch: JSONResponse( MOCK_EMBED_RICH_SUCCESS_RESPONSE ),
	},
	{
		match: isEmbedding( 'https://twitter.com/thatbunty' ),
		onRequestMatch: JSONResponse( MOCK_BAD_EMBED_PROVIDER_RESPONSE ),
	},
	{
		match: isEmbedding( 'https://twitter.com/wooyaygutenberg123454312' ),
		onRequestMatch: JSONResponse( MOCK_CANT_EMBED_RESPONSE ),
	},
	{
		match: isEmbedding( 'https://giphy.com/gifs/reaction-jdOm0IddQuJP2' ),
		onRequestMatch: JSONResponse( MOCK_EMBED_RICH_SUCCESS_RESPONSE ),
	},
];

const addEmbeds = async () => {
	// Valid embed.
	await clickBlockAppender();
	await page.keyboard.type( '/embed' );
	await page.keyboard.press( 'Enter' );
	await page.keyboard.type( 'https://twitter.com/notnownikki' );
	await page.keyboard.press( 'Enter' );

	// Valid provider; invalid content.
	await clickBlockAppender();
	await page.keyboard.type( '/embed' );
	await page.keyboard.press( 'Enter' );
	await page.keyboard.type( 'https://twitter.com/wooyaygutenberg123454312' );
	await page.keyboard.press( 'Enter' );

	// WordPress invalid content.
	await clickBlockAppender();
	await page.keyboard.type( '/embed' );
	await page.keyboard.press( 'Enter' );
	await page.keyboard.type( 'https://wordpress.org/gutenberg/handbook/' );
	await page.keyboard.press( 'Enter' );

	// Provider whose oembed API has gone wrong.
	await clickBlockAppender();
	await page.keyboard.type( '/embed' );
	await page.keyboard.press( 'Enter' );
	await page.keyboard.type( 'https://twitter.com/thatbunty' );
	await page.keyboard.press( 'Enter' );

	// WordPress content that can be embedded.
	await clickBlockAppender();
	await page.keyboard.type( '/embed' );
	await page.keyboard.press( 'Enter' );
	await page.keyboard.type( 'https://wordpress.org/gutenberg/handbook/block-api/attributes/' );
	await page.keyboard.press( 'Enter' );

	// Video content.
	await clickBlockAppender();
	await page.keyboard.type( '/embed' );
	await page.keyboard.press( 'Enter' );
	await page.keyboard.type( 'https://www.youtube.com/watch?v=lXMskKTw3Bc' );
	await page.keyboard.press( 'Enter' );

	// Photo content.
	await clickBlockAppender();
	await page.keyboard.type( '/embed' );
	await page.keyboard.press( 'Enter' );
	await page.keyboard.type( 'https://cloudup.com/cQFlxqtY4ob' );
	await page.keyboard.press( 'Enter' );
};

describe( 'Embedding content', () => {
	beforeAll( () => {
		setUpResponseMocking( MOCK_RESPONSES );
	} );
	beforeEach( newPost );

	it( 'should render embeds in the correct state', async () => {
		await addEmbeds();
		// The successful embeds should be in a correctly classed figure element.
		// This tests that they have switched to the correct block.
		await page.waitForSelector( 'figure.wp-block-embed-twitter' );
		await page.waitForSelector( 'figure.wp-block-embed-cloudup' );
		await page.waitForSelector( 'figure.wp-block-embed-wordpress' );
		// Video embed should also have the aspect ratio class.
		await page.waitForSelector( 'figure.wp-block-embed-youtube.wp-embed-aspect-16-9' );

		// Each failed embed should be in the edit state.
		await page.waitForSelector( 'input[value="https://twitter.com/wooyaygutenberg123454312"]' );
		await page.waitForSelector( 'input[value="https://twitter.com/thatbunty"]' );
		await page.waitForSelector( 'input[value="https://wordpress.org/gutenberg/handbook/"]' );
	} );

	it( 'should handle non-embeddable pasted URLs', async () => {
		await clickBlockAppender();
		// URL that cannot be embedded.
		await page.keyboard.type( 'https://twitter.com/wooyaygutenberg123454312' );
		await pressWithModifier( META_KEY, 'a' ); // Select the URL we just typed.
		await pressWithModifier( META_KEY, 'x' ); // Cut it.
		await pressWithModifier( META_KEY, 'v' ); // Paste it. This should trigger the embed paste transformation.
		// wait for a paragraph with the url in it
		await page.waitForSelector( '.editor-block-list__block[data-type="core/paragraph"]' );
		// Get the innerText from the rich text editor.
		const text = await page.$eval(
			'.editor-block-list__block[data-type="core/paragraph"] .editor-rich-text',
			( element ) => element.innerText
		);
		expect( text ).toMatch( 'https://twitter.com/wooyaygutenberg123454312' );
	} );

	it( 'should handle embeddable pasted URLs', async () => {
		await clickBlockAppender();
		// URL that can be embedded.
		await page.keyboard.type( 'https://www.youtube.com/watch?v=lXMskKTw3Bc' );
		await pressWithModifier( META_KEY, 'a' ); // Select the URL we just typed.
		await pressWithModifier( META_KEY, 'x' ); // Cut it.
		await pressWithModifier( META_KEY, 'v' ); // Paste it. This should trigger the embed paste transformation.
		// Wait for the embed block.
		await page.waitForSelector( 'figure.wp-block-embed-youtube.wp-embed-aspect-16-9' );
	} );

	it( 'should put unknown but embeddable pasted URLs into the generic embed block', async () => {
		await clickBlockAppender();
		// URL that can be embedded, but we don't have a specific block for.
		await page.keyboard.type( 'https://giphy.com/gifs/reaction-jdOm0IddQuJP2' );
		await pressWithModifier( META_KEY, 'a' ); // Select the URL we just typed.
		await pressWithModifier( META_KEY, 'x' ); // Cut it.
		await pressWithModifier( META_KEY, 'v' ); // Paste it. This should trigger the embed paste transformation.
		// Wait for the embed block.
		await page.waitForSelector( '.editor-block-list__block[data-type="core/embed"]' );
	} );
} );
