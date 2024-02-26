/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const EMBED_URLS = [
	'/oembed/1.0/proxy',
	`rest_route=${ encodeURIComponent( '/oembed/1.0/proxy' ) }`,
];
const MOCK_RESPONSES = {
	url: 'https://twitter.com/wordpress',
	html: '<p>Mock success response.</p>',
	type: 'rich',
	provider_name: 'Twitter',
	provider_url: 'https://twitter.com',
	version: '1.0',
};

test.describe( 'Embed block inside a locked all parent', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-innerblocks-locking-all-embed'
		);
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-innerblocks-locking-all-embed'
		);
	} );

	test( 'embed block should be able to embed external content', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await page.route(
			( url ) => EMBED_URLS.some( ( u ) => url.href.includes( u ) ),
			async ( route ) => {
				await route.fulfill( {
					json: MOCK_RESPONSES,
				} );
			}
		);

		await editor.insertBlock( {
			name: 'test/test-inner-blocks-locking-all-embed',
		} );
		await page
			.getByRole( 'textbox', { name: 'Embed URL' } )
			.fill( 'https://twitter.com/wordpress' );
		await page.keyboard.press( 'Enter' );

		await expect(
			page.getByRole( 'document', { name: 'Block: Twitter' } )
		).toBeVisible();
	} );
} );
