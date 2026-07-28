/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/** @typedef {import('@playwright/test').Page} Page */
/** @typedef {import('@wordpress/e2e-test-utils-playwright').Editor} Editor */

/**
 * Returns the major Chromium version from the browser's user agent, or 0 if not Chromium.
 *
 * @param {Page} page Playwright page object.
 * @return {Promise<number>} Major Chromium version.
 */
async function getChromiumMajorVersion( page ) {
	return page.evaluate( () => {
		const match = window.navigator.userAgent.match( /Chrome\/(\d+)/ );
		return match ? parseInt( match[ 1 ], 10 ) : 0;
	} );
}

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

test.use( {
	embedUtils: async ( { page, editor }, use ) => {
		await use( new EmbedUtils( { page, editor } ) );
	},
} );

test.describe( 'Document-Isolation-Policy', () => {
	test.beforeEach( async ( { admin, page } ) => {
		// These tests only apply to Chromium 137+.
		test.skip(
			( await getChromiumMajorVersion( page ) ) < 137,
			'Document-Isolation-Policy requires Chromium 137+'
		);

		await admin.createNewPost();
	} );

	test( 'should send Document-Isolation-Policy header', async ( {
		page,
	} ) => {
		// Navigate and capture response headers.
		const response = await page.goto( page.url() );
		const headers = response.headers();

		expect( headers[ 'document-isolation-policy' ] ).toBe(
			'isolate-and-credentialless'
		);
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
