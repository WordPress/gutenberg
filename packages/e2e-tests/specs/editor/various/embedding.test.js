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
		'<div class="wp-embedded-content" data-secret="shhhh it is a secret"></div>',
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

const MOCK_EMBED_PHOTO_SUCCESS_RESPONSE = {
	url: 'https://cloudup.com/cQFlxqtY4ob',
	html: '<p>Mock success response.</p>',
	type: 'photo',
	provider_name: 'Cloudup',
	provider_url: 'https://cloudup.com',
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
		onRequestMatch: createJSONResponse( MOCK_EMBED_PHOTO_SUCCESS_RESPONSE ),
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

async function insertEmbed( URL ) {
	await clickBlockAppender();
	await page.keyboard.type( '/embed' );
	await page.waitForXPath(
		`//*[contains(@class, "components-autocomplete__result") and contains(@class, "is-selected") and contains(text(), 'Embed')]`
	);
	await page.keyboard.press( 'Enter' );
	await page.keyboard.type( URL );
	await page.keyboard.press( 'Enter' );
}

describe( 'Embedding content', () => {
	beforeEach( async () => {
		await setUpResponseMocking( MOCK_RESPONSES );
		await createNewPost();
	} );

	it( 'should render embeds in the correct state', async () => {
		// Valid embed. Should render valid figure element.
		await insertEmbed( 'https://twitter.com/notnownikki' );
		await page.waitForSelector( 'figure.wp-block-embed' );

		// Valid provider; invalid content. Should render failed, edit state.
		await insertEmbed( 'https://twitter.com/wooyaygutenberg123454312' );
		await page.waitForSelector(
			'input[value="https://twitter.com/wooyaygutenberg123454312"]'
		);

		// WordPress invalid content. Should render failed, edit state.
		await insertEmbed( 'https://wordpress.org/gutenberg/handbook/' );
		await page.waitForSelector(
			'input[value="https://wordpress.org/gutenberg/handbook/"]'
		);

		// Provider whose oembed API has gone wrong. Should render failed, edit
		// state.
		await insertEmbed( 'https://twitter.com/thatbunty' );
		await page.waitForSelector(
			'input[value="https://twitter.com/thatbunty"]'
		);

		// WordPress content that can be embedded. Should render valid figure
		// element.
		await insertEmbed(
			'https://wordpress.org/gutenberg/handbook/block-api/attributes/'
		);
		await page.waitForSelector( 'figure.wp-block-embed' );

		// Video content. Should render valid figure element, and include the
		// aspect ratio class.
		await insertEmbed( 'https://www.youtube.com/watch?v=lXMskKTw3Bc' );
		await page.waitForSelector(
			'figure.wp-block-embed.is-type-video.wp-embed-aspect-16-9'
		);

		// Photo content. Should render valid figure element.
		await insertEmbed( 'https://cloudup.com/cQFlxqtY4ob' );
		await page.waitForSelector(
			'iframe[title="Embedded content from cloudup"'
		);

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should allow the user to convert unembeddable URLs to a paragraph with a link in it', async () => {
		// URL that can't be embedded.
		await insertEmbed( 'https://twitter.com/wooyaygutenberg123454312' );

		// Wait for the request to fail and present an error. Since placeholder
		// has styles applied which depend on resize observer, wait for the
		// expected size class to settle before clicking, since otherwise a race
		// condition could occur on the placeholder layout vs. click intent.
		await page.waitForSelector(
			'.components-placeholder.is-large .components-placeholder__error'
		);

		await clickButton( 'Convert to link' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should retry embeds that could not be embedded with trailing slashes, without the trailing slashes', async () => {
		await insertEmbed( 'https://twitter.com/notnownikki/' );
		// The twitter block should appear correctly.
		await page.waitForSelector( 'figure.wp-block-embed' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should allow the user to try embedding a failed URL again', async () => {
		// URL that can't be embedded.
		await insertEmbed( 'https://twitter.com/wooyaygutenberg123454312' );

		// Wait for the request to fail and present an error. Since placeholder
		// has styles applied which depend on resize observer, wait for the
		// expected size class to settle before clicking, since otherwise a race
		// condition could occur on the placeholder layout vs. click intent.
		await page.waitForSelector(
			'.components-placeholder.is-large .components-placeholder__error'
		);

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
		await page.waitForSelector( 'figure.wp-block-embed' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
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
			'.editor-post-publish-panel [id^=inspector-text-control-]',
			( el ) => el.value
		);

		// Start a new post, embed the previous post.
		await createNewPost();
		await insertEmbed( postUrl );

		// Check the block has become a WordPress block.
		await page.waitForSelector( 'figure.wp-block-embed' );
	} );
} );
