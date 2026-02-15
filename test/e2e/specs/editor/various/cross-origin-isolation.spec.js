/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/** @typedef {import('@playwright/test').Page} Page */
/** @typedef {import('@wordpress/e2e-test-utils-playwright').Editor} Editor */

const EMBED_URLS = [
	'/oembed/1.0/proxy',
	`rest_route=${ encodeURIComponent( '/oembed/1.0/proxy' ) }`,
];

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
	html: '<iframe width="16" height="9" src="https://www.youtube.com/embed/lXMskKTw3Bc"></iframe>',
	type: 'video',
	provider_name: 'YouTube',
	provider_url: 'https://youtube.com',
	version: '1.0',
};

test.use( {
	embedUtils: async ( { page, editor }, use ) => {
		await use( new EmbedUtils( { page, editor } ) );
	},
} );

test.describe( 'Cross-origin isolation', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should be cross-origin isolated by default', async ( { page } ) => {
		// Verify that cross-origin isolation IS enabled (default state
		// now that client-side media processing is graduated).
		const isCrossOriginIsolated = await page.evaluate(
			() => window.crossOriginIsolated
		);
		expect( isCrossOriginIsolated ).toBe( true );
	} );

	test( 'should render embed previews when cross-origin isolated', async ( {
		editor,
		embedUtils,
	} ) => {
		await embedUtils.interceptRequests( {
			'https://twitter.com/notnownikki': MOCK_EMBED_RICH_SUCCESS_RESPONSE,
		} );

		await embedUtils.insertEmbed( 'https://twitter.com/notnownikki' );

		// Verify the embed iframe is visible.
		const embedBlock = editor.canvas
			.getByRole( 'document', { name: 'Block' } )
			.last();
		const iframe = embedBlock.locator( 'iframe' );
		await expect(
			iframe,
			'Embed should render iframe when cross-origin isolated'
		).toHaveAttribute( 'title', 'Embedded content from twitter.com' );
	} );

	test( 'should render video embeds with aspect ratio when cross-origin isolated', async ( {
		editor,
		embedUtils,
	} ) => {
		await embedUtils.interceptRequests( {
			'https://www.youtube.com/watch?v=lXMskKTw3Bc':
				MOCK_EMBED_VIDEO_SUCCESS_RESPONSE,
		} );

		await embedUtils.insertEmbed(
			'https://www.youtube.com/watch?v=lXMskKTw3Bc'
		);

		// Verify the embed renders with aspect ratio class.
		const embedBlock = editor.canvas
			.getByRole( 'document', { name: 'Block' } )
			.last();
		await expect(
			embedBlock,
			'Video embed should have aspect ratio class'
		).toHaveClass( /wp-embed-aspect-16-9/ );
	} );

	test( 'should add crossorigin attribute to embed iframes', async ( {
		editor,
		embedUtils,
	} ) => {
		await embedUtils.interceptRequests( {
			'https://twitter.com/notnownikki': MOCK_EMBED_RICH_SUCCESS_RESPONSE,
		} );

		await embedUtils.insertEmbed( 'https://twitter.com/notnownikki' );

		const embedBlock = editor.canvas
			.getByRole( 'document', { name: 'Block' } )
			.last();
		const iframe = embedBlock.locator( 'iframe.components-sandbox' );

		await expect(
			iframe,
			'Embed iframe should have crossorigin attribute'
		).toHaveAttribute( 'crossorigin', 'anonymous' );
	} );

	test( 'should add credentialless attribute to embed iframes when supported', async ( {
		page,
		editor,
		embedUtils,
	} ) => {
		// Check if browser supports credentialless iframes.
		const supportsCredentialless = await page.evaluate(
			() => 'credentialless' in window.HTMLIFrameElement.prototype
		);

		test.skip(
			! supportsCredentialless,
			'Browser does not support credentialless iframes'
		);

		await embedUtils.interceptRequests( {
			'https://twitter.com/notnownikki': MOCK_EMBED_RICH_SUCCESS_RESPONSE,
		} );

		await embedUtils.insertEmbed( 'https://twitter.com/notnownikki' );

		const embedBlock = editor.canvas
			.getByRole( 'document', { name: 'Block' } )
			.last();
		const iframe = embedBlock.locator( 'iframe.components-sandbox' );

		await expect(
			iframe,
			'Embed iframe should have credentialless attribute'
		).toHaveAttribute( 'credentialless', '' );
	} );

	test( 'should show placeholder for denylisted providers when credentialless not supported', async ( {
		page,
		editor,
		embedUtils,
	} ) => {
		// This test only applies when credentialless is NOT supported.
		const supportsCredentialless = await page.evaluate(
			() => 'credentialless' in window.HTMLIFrameElement.prototype
		);

		test.skip(
			supportsCredentialless,
			'Browser supports credentialless iframes'
		);

		await embedUtils.interceptRequests( {
			'https://twitter.com/notnownikki': MOCK_EMBED_RICH_SUCCESS_RESPONSE,
		} );

		await embedUtils.insertEmbed( 'https://twitter.com/notnownikki' );

		const embedBlock = editor.canvas
			.getByRole( 'document', { name: 'Block' } )
			.last();

		// When credentialless is not supported, embeds should show a placeholder.
		await expect(
			embedBlock.locator( '.components-placeholder__error' ),
			'Should show placeholder when credentialless not supported'
		).toContainText( "can't be previewed" );
	} );
} );

class EmbedUtils {
	/** @type {Page} */
	#page;
	/** @type {Editor} */
	#editor;

	constructor( { page, editor } ) {
		this.#page = page;
		this.#editor = editor;
	}

	/**
	 * @param {URL} url
	 */
	isRESTRoute( url ) {
		return EMBED_URLS.some( ( route ) => {
			return url.href.includes( route );
		} );
	}

	async interceptRequests( responses ) {
		await this.#page.route(
			( url ) => this.isRESTRoute( url ),
			async ( route, request ) => {
				const embedUrl = new URL( request.url() ).searchParams.get(
					'url'
				);
				const response = responses[ embedUrl ];

				if ( response ) {
					await route.fulfill( {
						json: response,
					} );
				} else {
					await route.continue();
				}
			}
		);
	}

	async insertEmbed( url ) {
		await test.step( `Inserting embed ${ url }`, async () => {
			await this.#editor.insertBlock( { name: 'core/embed' } );
			await this.#editor.canvas
				.getByRole( 'textbox', { name: 'Embed URL' } )
				.last()
				.fill( url );
			await this.#page.keyboard.press( 'Enter' );
		} );
	}
}
