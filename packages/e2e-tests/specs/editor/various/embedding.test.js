/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	clickButton,
	createEmbeddingMatcher,
	createJSONResponse,
	createNewPost,
	createURLMatcher,
	getEditedPostContent,
	insertBlock,
	publishPost,
	setUpResponseMocking,
} from '@wordpress/e2e-test-utils';

const MOCK_EMBED_WORDPRESS_SUCCESS_RESPONSE = {
	url: 'https://wordpress.org/gutenberg/handbook/block-api/attributes/',
	html:
		'<div class="wp-embedded-content" data-secret="shhhh it is a secret">WordPress embed</div>',
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

const MOCK_EMBED_AUDIO_SUCCESS_RESPONSE = {
	url: 'https://soundcloud.com/a-boogie-wit-da-hoodie/swervin',
	html: '<iframe width="16" height="9"></iframe>',
	type: 'audio',
	provider_name: 'SoundCloud',
	provider_url: 'https://soundcloud.com',
	version: '1.0',
};

const MOCK_EMBED_IMAGE_SUCCESS_RESPONSE = {
	url: 'https://www.instagram.com/p/Bvl97o2AK6x/',
	html: '<iframe width="16" height="9"></iframe>',
	type: 'video',
	provider_name: 'Instagram',
	provider_url: 'https://www.instagram.com',
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
	html:
		'<a href="https://twitter.com/wooyaygutenberg123454312">https://twitter.com/wooyaygutenberg123454312</a>',
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
		match: createEmbeddingMatcher(
			'https://wordpress.org/gutenberg/handbook'
		),
		onRequestMatch: createJSONResponse( MOCK_BAD_WORDPRESS_RESPONSE ),
	},
	{
		match: createEmbeddingMatcher(
			'https://wordpress.org/gutenberg/handbook/'
		),
		onRequestMatch: createJSONResponse( MOCK_BAD_WORDPRESS_RESPONSE ),
	},
	{
		match: createEmbeddingMatcher(
			'https://wordpress.org/gutenberg/handbook/block-api/attributes/'
		),
		onRequestMatch: createJSONResponse(
			MOCK_EMBED_WORDPRESS_SUCCESS_RESPONSE
		),
	},
	{
		match: createEmbeddingMatcher(
			'https://www.youtube.com/watch?v=lXMskKTw3Bc'
		),
		onRequestMatch: createJSONResponse( MOCK_EMBED_VIDEO_SUCCESS_RESPONSE ),
	},
	{
		match: createEmbeddingMatcher(
			'https://soundcloud.com/a-boogie-wit-da-hoodie/swervin'
		),
		onRequestMatch: createJSONResponse( MOCK_EMBED_AUDIO_SUCCESS_RESPONSE ),
	},
	{
		match: createEmbeddingMatcher(
			'https://www.instagram.com/p/Bvl97o2AK6x/'
		),
		onRequestMatch: createJSONResponse( MOCK_EMBED_IMAGE_SUCCESS_RESPONSE ),
	},
	{
		match: createEmbeddingMatcher( 'https://cloudup.com/cQFlxqtY4ob' ),
		onRequestMatch: createJSONResponse( MOCK_EMBED_RICH_SUCCESS_RESPONSE ),
	},
	{
		match: createEmbeddingMatcher( 'https://twitter.com/notnownikki' ),
		onRequestMatch: createJSONResponse( MOCK_EMBED_RICH_SUCCESS_RESPONSE ),
	},
	{
		match: createEmbeddingMatcher( 'https://twitter.com/notnownikki/' ),
		onRequestMatch: createJSONResponse( MOCK_CANT_EMBED_RESPONSE ),
	},
	{
		match: createEmbeddingMatcher( 'https://twitter.com/thatbunty' ),
		onRequestMatch: createJSONResponse( MOCK_BAD_EMBED_PROVIDER_RESPONSE ),
	},
	{
		match: createEmbeddingMatcher(
			'https://twitter.com/wooyaygutenberg123454312'
		),
		onRequestMatch: createJSONResponse( MOCK_CANT_EMBED_RESPONSE ),
	},
	// Respond to the instagram URL with a non-image response, doesn't matter what it is,
	// just make sure the image errors.
	{
		match: createURLMatcher( 'https://www.instagram.com/p/Bvl97o2AK6x/' ),
		onRequestMatch: createJSONResponse( MOCK_CANT_EMBED_RESPONSE ),
	},
];

describe( 'Embedding content', () => {
	beforeEach( async () => {
		await setUpResponseMocking( MOCK_RESPONSES );
		await createNewPost();
	} );

	it( 'should render embeds in the correct state', async () => {
		// Valid embed. Should render valid figure element.
		await clickBlockAppender();
		await page.keyboard.type( '/embed' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'https://twitter.com/notnownikki' );
		await page.keyboard.press( 'Enter' );
		await page.waitForSelector( 'figure.wp-block-embed-twitter' );

		// Valid provider; invalid content. Should render failed, edit state.
		await clickBlockAppender();
		await page.keyboard.type( '/embed' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type(
			'https://twitter.com/wooyaygutenberg123454312'
		);
		await page.keyboard.press( 'Enter' );
		await page.waitForSelector(
			'input[value="https://twitter.com/wooyaygutenberg123454312"]'
		);

		// WordPress invalid content. Should render failed, edit state.
		await clickBlockAppender();
		await page.keyboard.type( '/embed' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'https://wordpress.org/gutenberg/handbook/' );
		await page.keyboard.press( 'Enter' );
		await page.waitForSelector(
			'input[value="https://wordpress.org/gutenberg/handbook/"]'
		);

		// Provider whose oembed API has gone wrong. Should render failed, edit
		// state.
		await clickBlockAppender();
		await page.keyboard.type( '/embed' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'https://twitter.com/thatbunty' );
		await page.keyboard.press( 'Enter' );
		await page.waitForSelector(
			'input[value="https://twitter.com/thatbunty"]'
		);

		// WordPress content that can be embedded. Should render valid figure
		// element.
		await clickBlockAppender();
		await page.keyboard.type( '/embed' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type(
			'https://wordpress.org/gutenberg/handbook/block-api/attributes/'
		);
		await page.keyboard.press( 'Enter' );
		await page.waitForSelector( 'figure.wp-block-embed-wordpress' );

		// Video content. Should render valid figure element, and include the
		// aspect ratio class.
		await clickBlockAppender();
		await page.keyboard.type( '/embed' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type(
			'https://www.youtube.com/watch?v=lXMskKTw3Bc'
		);
		await page.keyboard.press( 'Enter' );
		await page.waitForSelector(
			'figure.wp-block-embed-youtube.wp-embed-aspect-16-9'
		);

		// Photo content. Should render valid figure element.
		await clickBlockAppender();
		await page.keyboard.type( '/embed' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'https://cloudup.com/cQFlxqtY4ob' );
		await page.keyboard.press( 'Enter' );
	} );

	it( 'should allow the user to convert unembeddable URLs to a paragraph with a link in it', async () => {
		// URL that can't be embedded.
		await clickBlockAppender();
		await page.keyboard.type( '/embed' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type(
			'https://twitter.com/wooyaygutenberg123454312'
		);
		await page.keyboard.press( 'Enter' );

		// Wait for the request to fail and present an error.
		await page.waitForSelector( '.components-placeholder__error' );

		await clickButton( 'Convert to link' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should retry embeds that could not be embedded with trailing slashes, without the trailing slashes', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '/embed' );
		await page.keyboard.press( 'Enter' );
		// This URL can't be embedded, but without the trailing slash, it can.
		await page.keyboard.type( 'https://twitter.com/notnownikki/' );
		await page.keyboard.press( 'Enter' );
		// The twitter block should appear correctly.
		await page.waitForSelector( 'figure.wp-block-embed-twitter' );
	} );

	it( 'should allow the user to try embedding a failed URL again', async () => {
		// URL that can't be embedded.
		await clickBlockAppender();
		await page.keyboard.type( '/embed' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type(
			'https://twitter.com/wooyaygutenberg123454312'
		);
		await page.keyboard.press( 'Enter' );

		// Wait for the request to fail and present an error.
		await page.waitForSelector( '.components-placeholder__error' );

		// Set up a different mock to make sure that try again actually does make the request again.
		await setUpResponseMocking( [
			{
				match: createEmbeddingMatcher(
					'https://twitter.com/wooyaygutenberg123454312'
				),
				onRequestMatch: createJSONResponse(
					MOCK_EMBED_RICH_SUCCESS_RESPONSE
				),
			},
		] );
		await clickButton( 'Try again' );
		await page.waitForSelector( 'figure.wp-block-embed-twitter' );
	} );

	it( 'should switch to the WordPress block correctly', async () => {
		// This test is to make sure that WordPress embeds are detected correctly,
		// because the HTML can vary, and the block is detected by looking for
		// classes in the HTML, so we need to flag up if the HTML changes.

		// Publish a post to embed.
		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'Hello there!' );
		await publishPost();
		const postUrl = await page.$eval(
			'[id^=inspector-text-control-]',
			( el ) => el.value
		);

		// Start a new post, embed the previous post.
		await createNewPost();
		await clickBlockAppender();
		await page.keyboard.type( '/embed' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( postUrl );
		await page.keyboard.press( 'Enter' );

		// Check the block has become a WordPress block.
		await page.waitForSelector( '.wp-block-embed-wordpress' );
	} );
} );
