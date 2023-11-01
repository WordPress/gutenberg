/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
	insertBlock,
	createEmbeddingMatcher,
	createJSONResponse,
	setUpResponseMocking,
} from '@wordpress/e2e-test-utils';

const MOCK_RESPONSES = [
	{
		match: createEmbeddingMatcher( 'https://twitter.com/wordpress' ),
		onRequestMatch: createJSONResponse( {
			url: 'https://twitter.com/wordpress',
			html: '<p>Mock success response.</p>',
			type: 'rich',
			provider_name: 'Twitter',
			provider_url: 'https://twitter.com',
			version: '1.0',
		} ),
	},
];

describe( 'Embed block inside a locked all parent', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-innerblocks-locking-all-embed' );
	} );

	beforeEach( async () => {
		await setUpResponseMocking( MOCK_RESPONSES );
		await createNewPost();
	} );

	afterAll( async () => {
		await deactivatePlugin(
			'gutenberg-test-innerblocks-locking-all-embed'
		);
	} );

	it( 'embed block should be able to embed external content', async () => {
		await insertBlock( 'Test Inner Blocks Locking All Embed' );
		const embedInputSelector =
			'.components-placeholder__input[aria-label="Embed URL"]';
		await page.waitForSelector( embedInputSelector );
		await page.click( embedInputSelector );
		// This URL should not have a trailing slash.
		await page.keyboard.type( 'https://twitter.com/wordpress' );
		await page.keyboard.press( 'Enter' );
		// The twitter block should appear correctly.
		await page.waitForSelector( 'figure.wp-block-embed' );
	} );
} );
