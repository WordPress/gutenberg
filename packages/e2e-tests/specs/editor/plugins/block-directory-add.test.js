/**
 * WordPress dependencies
 */
import {
	createNewPost,
	searchForBlock,
	insertBlockDirectoryBlock,
	setUpResponseMocking,
	getEditedPostContent,
	createJSONResponse,
} from '@wordpress/e2e-test-utils';

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
		title: 'Test Block for Block Directory',
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

const MOCK_EMPTY_RESPONSES = [
	{
		match: ( request ) =>
			matchUrl( request.url(), SEARCH_URLS ) &&
			request.method() === 'GET',
		onRequestMatch: createJSONResponse( [] ),
	},
];

const MOCK_BLOCKS_RESPONSES = [
	{
		// Mock response for search with the block.
		match: ( request ) =>
			matchUrl( request.url(), SEARCH_URLS ) &&
			request.method() === 'GET',
		onRequestMatch: createJSONResponse( [ MOCK_BLOCK1, MOCK_BLOCK2 ] ),
	},
	{
		// Mock response for block type.
		match: ( request ) => matchUrl( request.url(), BLOCK_TYPE_URLS ),
		onRequestMatch: createJSONResponse( {} ),
	},
	{
		// Mock response for install.
		match: ( request ) => matchUrl( request.url(), INSTALL_URLS ),
		onRequestMatch: createJSONResponse(
			MOCK_INSTALLED_BLOCK_PLUGIN_DETAILS
		),
	},
	{
		// Mock the response for the js asset once it gets injected.
		match: ( request ) => request.url().includes( MOCK_BLOCK1.assets[ 0 ] ),
		onRequestMatch: createResponse(
			Buffer.from( block, 'utf8' ),
			'application/javascript; charset=utf-8'
		),
	},
	{
		// Mock the post-new page as requested via apiFetch for determining new CSS/JS assets.
		match: ( request ) => request.url().includes( '/post-new.php' ),
		onRequestMatch: createResponse(
			`<html><head><script id="mock-block-js" src="${ MOCK_BLOCK1.assets[ 0 ] }"></script></head><body/></html>`,
			'text/html; charset=UTF-8'
		),
	},
];

function getResponseObject( obj, contentType ) {
	return {
		status: 200,
		contentType,
		body: obj,
	};
}

function createResponse( mockResponse, contentType ) {
	return async ( request ) =>
		request.respond( getResponseObject( mockResponse, contentType ) );
}

const matchUrl = ( reqUrl, urls ) => {
	return urls.some( ( el ) => reqUrl.indexOf( el ) >= 0 );
};

describe( 'adding blocks from block directory', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'Should show an empty state when no plugin is found.', async () => {
		// Be super weird so there won't be a matching block installed.
		const impossibleBlockName = '@#$@@Dsdsdfw2#$@';

		// Return an empty list of plugins.
		await setUpResponseMocking( MOCK_EMPTY_RESPONSES );

		// Search for the block via the inserter.
		await searchForBlock( impossibleBlockName );

		const selectorContent = await page.evaluate(
			() =>
				document.querySelector( '.block-editor-inserter__main-area' )
					.innerHTML
		);
		expect( selectorContent ).toContain(
			'block-editor-inserter__no-results'
		);
	} );

	it( 'Should be able to add (the first) block.', async () => {
		// Setup our mocks.
		await setUpResponseMocking( MOCK_BLOCKS_RESPONSES );

		// Search for the block via the inserter.
		await insertBlockDirectoryBlock( MOCK_BLOCK1.title );

		await page.waitForSelector( `div[data-type="${ MOCK_BLOCK1.name }"]` );

		// The block will auto select and get added, make sure we see it in the content.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
