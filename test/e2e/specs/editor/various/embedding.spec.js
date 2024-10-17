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

const MOCK_EMBED_WORDPRESS_SUCCESS_RESPONSE = {
	url: 'https://developer.wordpress.org/block-editor/reference-guides/block-api/block-attributes/',
	html: '<div class="wp-embedded-content" data-secret="shhhh it is a secret"></div>',
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

test.use( {
	embedUtils: async ( { page, editor }, use ) => {
		await use( new EmbedUtils( { page, editor } ) );
	},
} );

test.describe( 'Embedding content', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should render embeds in the correct state', async ( {
		editor,
		embedUtils,
	} ) => {
		await embedUtils.interceptRequests( {
			'https://twitter.com/notnownikki': MOCK_EMBED_RICH_SUCCESS_RESPONSE,
			'https://twitter.com/wooyaygutenberg123454312':
				MOCK_CANT_EMBED_RESPONSE,
			'https://wordpress.org/gutenberg/handbook/':
				MOCK_BAD_WORDPRESS_RESPONSE,
			'https://twitter.com/thatbunty': MOCK_BAD_EMBED_PROVIDER_RESPONSE,
			'https://developer.wordpress.org/block-editor/reference-guides/block-api/block-attributes/':
				MOCK_EMBED_WORDPRESS_SUCCESS_RESPONSE,
			'https://www.youtube.com/watch?v=lXMskKTw3Bc':
				MOCK_EMBED_VIDEO_SUCCESS_RESPONSE,
			'https://cloudup.com/cQFlxqtY4ob':
				MOCK_EMBED_PHOTO_SUCCESS_RESPONSE,
		} );

		const currenEmbedBlock = editor.canvas
			.getByRole( 'document', { name: 'Block' } )
			.last();

		await embedUtils.insertEmbed( 'https://twitter.com/notnownikki' );
		await expect(
			currenEmbedBlock.locator( 'iframe' ),
			'Valid embed. Should render valid element.'
		).toHaveAttribute( 'title', 'Embedded content from twitter.com' );

		await embedUtils.insertEmbed(
			'https://twitter.com/wooyaygutenberg123454312'
		);
		await expect(
			currenEmbedBlock.getByRole( 'textbox', { name: 'Embed URL' } ),
			'Valid provider; invalid content. Should render failed, edit state.'
		).toHaveValue( 'https://twitter.com/wooyaygutenberg123454312' );

		await embedUtils.insertEmbed(
			'https://wordpress.org/gutenberg/handbook/'
		);
		await expect(
			currenEmbedBlock.getByRole( 'textbox', { name: 'Embed URL' } ),
			'WordPress invalid content. Should render failed, edit state.'
		).toHaveValue( 'https://wordpress.org/gutenberg/handbook' );

		await embedUtils.insertEmbed( 'https://twitter.com/thatbunty' );
		await expect(
			currenEmbedBlock.getByRole( 'textbox', { name: 'Embed URL' } ),
			'Provider whose oembed API has gone wrong. Should render failed, edit state.'
		).toHaveValue( 'https://twitter.com/thatbunty' );

		await embedUtils.insertEmbed(
			'https://developer.wordpress.org/block-editor/reference-guides/block-api/block-attributes/'
		);
		await expect(
			currenEmbedBlock,
			'WordPress valid content. Should render valid figure element.'
		).toHaveClass( /wp-block-embed/ );

		await embedUtils.insertEmbed(
			'https://www.youtube.com/watch?v=lXMskKTw3Bc'
		);
		await expect(
			currenEmbedBlock,
			'Video content. Should render valid figure element, and include the aspect ratio class.'
		).toHaveClass( /wp-embed-aspect-16-9/ );

		await embedUtils.insertEmbed( 'https://cloudup.com/cQFlxqtY4ob' );
		await expect(
			currenEmbedBlock.locator( 'iframe' ),
			'Photo content. Should render valid iframe element.'
		).toHaveAttribute( 'title', 'Embedded content from cloudup.com' );
	} );

	test( 'should allow the user to convert unembeddable URLs to a paragraph with a link in it', async ( {
		editor,
		embedUtils,
	} ) => {
		await embedUtils.interceptRequests( {
			'https://twitter.com/wooyaygutenberg123454312':
				MOCK_CANT_EMBED_RESPONSE,
		} );
		await embedUtils.insertEmbed(
			'https://twitter.com/wooyaygutenberg123454312'
		);

		const embedBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Embed',
		} );

		await expect( embedBlock ).toContainText(
			'Sorry, this content could not be embedded.'
		);

		await embedBlock
			.getByRole( 'button', { name: 'Convert to link' } )
			.click();

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content:
						'<a href="https://twitter.com/wooyaygutenberg123454312">https://twitter.com/wooyaygutenberg123454312</a>',
				},
			},
		] );
	} );

	// Reason: A possible regression of https://github.com/WordPress/gutenberg/pull/14705.
	test( 'should retry embeds that could not be embedded with trailing slashes, without the trailing slashes', async ( {
		editor,
		embedUtils,
	} ) => {
		await embedUtils.interceptRequests( {
			'https://twitter.com/notnownikki/':
				MOCK_BAD_EMBED_PROVIDER_RESPONSE,
			'https://twitter.com/notnownikki': MOCK_EMBED_RICH_SUCCESS_RESPONSE,
		} );
		await embedUtils.insertEmbed( 'https://twitter.com/notnownikki/' );

		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Twitter',
			} )
		).toBeVisible();
	} );

	test( 'should allow the user to try embedding a failed URL again', async ( {
		editor,
		embedUtils,
	} ) => {
		await embedUtils.interceptRequests( {
			'https://twitter.com/wooyaygutenberg123454312':
				MOCK_CANT_EMBED_RESPONSE,
		} );
		await embedUtils.insertEmbed(
			'https://twitter.com/wooyaygutenberg123454312'
		);

		const embedBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Embed',
		} );

		await expect( embedBlock ).toContainText(
			'Sorry, this content could not be embedded.'
		);

		await embedUtils.interceptRequests( {
			'https://twitter.com/wooyaygutenberg123454312':
				MOCK_EMBED_RICH_SUCCESS_RESPONSE,
		} );

		await embedBlock.getByRole( 'button', { name: 'Try again' } ).click();
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Twitter',
			} )
		).toBeVisible();
	} );

	test( 'should switch to the WordPress block correctly', async ( {
		editor,
		embedUtils,
		requestUtils,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Local embed test',
			content: 'Hello there!',
			status: 'publish',
		} );

		await embedUtils.insertEmbed( post.link );
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Embed' } )
		).toBeVisible();
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
