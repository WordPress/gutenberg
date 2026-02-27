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

	test( 'should render embed previews', async ( { editor, embedUtils } ) => {
		await embedUtils.interceptRequests( {
			'https://twitter.com/notnownikki': MOCK_EMBED_RICH_SUCCESS_RESPONSE,
		} );

		await embedUtils.insertEmbed( 'https://twitter.com/notnownikki' );

		// Verify the embed iframe is visible.
		const embedBlock = editor.canvas
			.getByRole( 'document', { name: 'Block' } )
			.last();
		const iframe = embedBlock.locator( 'iframe' );
		await expect( iframe, 'Embed should render iframe' ).toHaveAttribute(
			'title',
			'Embedded content from twitter.com'
		);
	} );

	test( 'should render video embeds with aspect ratio', async ( {
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
} );

test.describe( 'Document-Isolation-Policy', () => {
	test.beforeEach( async ( { admin, page } ) => {
		// These tests only apply to Chrome 137+.
		const chromeVersion = await page.evaluate( () => {
			const match = window.navigator.userAgent.match( /Chrome\/(\d+)/ );
			return match ? parseInt( match[ 1 ], 10 ) : 0;
		} );

		test.skip(
			chromeVersion < 137,
			'Document-Isolation-Policy requires Chrome 137+'
		);

		await admin.createNewPost();
	} );

	test( 'should send Document-Isolation-Policy header instead of COEP/COOP', async ( {
		page,
	} ) => {
		// Navigate and capture response headers.
		const response = await page.goto( page.url() );
		const headers = response.headers();

		expect( headers[ 'document-isolation-policy' ] ).toBe(
			'isolate-and-credentialless'
		);
		expect( headers[ 'cross-origin-embedder-policy' ] ).toBeUndefined();
		expect( headers[ 'cross-origin-opener-policy' ] ).toBeUndefined();
	} );

	test( 'should not add credentialless to plugin iframes', async ( {
		page,
	} ) => {
		// Inject a test iframe (simulating a plugin iframe).
		await page.evaluate( () => {
			const iframe = document.createElement( 'iframe' );
			iframe.setAttribute( 'src', 'about:blank' );
			iframe.setAttribute( 'data-testid', 'plugin-iframe' );
			document.body.appendChild( iframe );
		} );

		// Wait for the iframe to be present in DOM.
		const pluginIframe = page.locator( '[data-testid="plugin-iframe"]' );
		await pluginIframe.waitFor();

		// The iframe should NOT have the credentialless attribute with DIP.
		await expect( pluginIframe ).not.toHaveAttribute( 'credentialless' );
	} );

	test( 'should render all embed previews normally with DIP', async ( {
		editor,
		embedUtils,
	} ) => {
		await embedUtils.interceptRequests( {
			'https://twitter.com/notnownikki': MOCK_EMBED_RICH_SUCCESS_RESPONSE,
		} );

		await embedUtils.insertEmbed( 'https://twitter.com/notnownikki' );

		// With DIP, the embed should render its preview iframe normally.
		const embedBlock = editor.canvas
			.getByRole( 'document', { name: 'Block' } )
			.last();
		const iframe = embedBlock.locator( 'iframe' );
		await expect(
			iframe,
			'Embed should render iframe preview with DIP active'
		).toHaveAttribute( 'title', 'Embedded content from twitter.com' );
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
