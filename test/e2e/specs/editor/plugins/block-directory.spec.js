/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const BLOCK1_NAME = 'block-directory-test-block/main-block';

// Urls to mock.
const SEARCH_URLS = [
	'/wp/v2/block-directory/search',
	`rest_route=${ encodeURIComponent( '/wp/v2/block-directory/search' ) }`,
];

const BLOCK_TYPE_URLS = [
	`/wp/v2/block-types/${ BLOCK1_NAME }`,
	`rest_route=${ encodeURIComponent(
		`/wp/v2/block-types/${ BLOCK1_NAME }`
	) }`,
];

const INSTALL_URLS = [
	'/wp/v2/plugins',
	`rest_route=${ encodeURIComponent( '/wp/v2/plugins' ) }`,
];

// Example Blocks.
const MOCK_BLOCK1 = {
	name: BLOCK1_NAME,
	title: 'Block Directory Test Block',
	description: 'This plugin is useful for the block.',
	id: 'block-directory-test-block',
	rating: 0,
	rating_count: 0,
	active_installs: 0,
	author_block_rating: 0,
	author_block_count: 1,
	author: 'No Author',
	icon: 'block-default',
	assets: [
		'https://fake_url.com/block.js', // We will mock this.
	],
	humanized_updated: '5 months ago',
	links: {},
};

const MOCK_INSTALLED_BLOCK_PLUGIN_DETAILS = {
	plugin: 'block-directory-test-block',
	status: 'active',
	name: 'Block Directory',
	plugin_uri: '',
	author: 'No Author',
	author_uri: '',
	description: {
		raw: 'This plugin is useful for the block.',
		rendered: 'This plugin is useful for the block.',
	},
	version: '1.0',
	network_only: false,
	requires_wp: '',
	requires_php: '',
	text_domain: 'block-directory-test-block',
	_links: {
		self: [
			{
				href: '',
			},
		],
	},
};

const MOCK_BLOCK2 = {
	...MOCK_BLOCK1,
	name: 'block-directory-test-block/secondary-block',
	title: 'Block Directory Test Block - Pt Deux',
	id: 'block-directory-test-secondary-block',
};

// Block that will be registered.
const block = `( function() {
	var registerBlockType = wp.blocks.registerBlockType;
	var el = wp.element.createElement;

	registerBlockType( '${ MOCK_BLOCK1.name }', {
		title: 'Block Directory Test Block',
		icon: 'hammer',
		category: 'text',
		attributes: {},
		edit: function( props ) {
			return el( 'p', null, 'Test Copy' );
		},
		save: function() {
			return null;
		},
	} );
} )();`;

function matchUrl( requestUrl, urls ) {
	return urls.some( ( url ) => requestUrl.href.includes( url ) );
}

test.describe( 'Block Directory', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'Should show an empty state when no plugin is found', async ( {
		page,
	} ) => {
		// Return an empty list of plugins.
		await page.route(
			( url ) => matchUrl( url, SEARCH_URLS ),
			async ( route, request ) => {
				if ( request.method() === 'GET' ) {
					await route.fulfill( {
						json: [],
					} );
				} else {
					await route.continue();
				}
			}
		);

		await page
			.getByRole( 'toolbar', { name: 'Document tools' } )
			.getByRole( 'button', { name: 'Block Inserter', exact: true } )
			.click();

		const blockLibrary = page.getByRole( 'region', {
			name: 'Block Library',
		} );

		/**
		 * Search for the block via the inserter.
		 * Be super weird so there won't be a matching block installed.
		 */
		await blockLibrary
			.getByRole( 'searchbox', {
				name: 'Search',
			} )
			.fill( '@$@@Dsdsdfw2$@' );

		/**
		 * The inserter can flash "No results found" before requesting results from the directory,
		 * fulfilling the first assertion.
		 * Waiting for these two elements ensures that the request was dispatched.
		 */
		await expect( blockLibrary ).toContainText( 'No results found.' );
		await expect( blockLibrary ).toContainText(
			'Interested in creating your own block?'
		);
	} );

	test( 'Should be able to add (the first) block', async ( { page } ) => {
		// Mock response for search with the block.
		await page.route(
			( url ) => matchUrl( url, SEARCH_URLS ),
			async ( route, request ) => {
				if ( request.method() === 'GET' ) {
					await route.fulfill( {
						json: [ MOCK_BLOCK1, MOCK_BLOCK2 ],
					} );
				} else {
					await route.continue();
				}
			}
		);

		// Mock response for block type.
		await page.route(
			( url ) => matchUrl( url, BLOCK_TYPE_URLS ),
			async ( route ) => {
				await route.fulfill( {
					json: {},
				} );
			}
		);

		// Mock response for install.
		await page.route(
			( url ) => matchUrl( url, INSTALL_URLS ),
			async ( route ) => {
				await route.fulfill( {
					json: MOCK_INSTALLED_BLOCK_PLUGIN_DETAILS,
				} );
			}
		);

		// Mock the response for the js asset once it gets injected.
		await page.route(
			( url ) => url.href.includes( MOCK_BLOCK1.assets[ 0 ] ),
			async ( route ) => {
				await route.fulfill( {
					contentType: 'application/javascript; charset=utf-8',
					body: Buffer.from( block, 'utf8' ),
				} );
			}
		);

		// Mock the post-new page as requested via apiFetch for determining new CSS/JS assets.
		await page.route(
			( url ) => url.href.includes( '/post-new.php' ),
			async ( route ) => {
				await route.fulfill( {
					contentType: 'text/html; charset=UTF-8',
					body: `<html><head><script id="mock-block-js" src="${ MOCK_BLOCK1.assets[ 0 ] }"></script></head><body/></html>`,
				} );
			}
		);

		await page
			.getByRole( 'toolbar', { name: 'Document tools' } )
			.getByRole( 'button', { name: 'Block Inserter', exact: true } )
			.click();

		const blockLibrary = page.getByRole( 'region', {
			name: 'Block Library',
		} );
		const downloadableBlock = page
			.getByRole( 'listbox', {
				name: 'Blocks available for install',
			} )
			.getByRole( 'option', {
				name: `Install ${ MOCK_BLOCK1.title }.`,
				exact: true,
			} );

		await blockLibrary
			.getByRole( 'searchbox', {
				name: 'Search',
			} )
			.fill( MOCK_BLOCK1.title );

		await expect( downloadableBlock ).toBeVisible();

		// Install the block.
		await downloadableBlock.click();
		await page
			.getByRole( 'button', { name: 'Dismiss this notice' } )
			.filter( { hasText: MOCK_BLOCK1.title } )
			.waitFor();

		await expect(
			page.getByRole( 'document', {
				name: `Block: ${ MOCK_BLOCK1.title }`,
			} )
		).toBeVisible();
	} );
} );
