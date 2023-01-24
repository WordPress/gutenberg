/**
 * External dependencies
 */
import {
	addBlock,
	getEditorHtml,
	initializeEditor,
	getBlock,
} from 'test/helpers';

/**
 * WordPress dependencies
 */
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';
import apiFetch from '@wordpress/api-fetch';

beforeAll( () => {
	// Register all core blocks
	registerCoreBlocks();
} );

afterAll( () => {
	// Clean up registered blocks
	getBlockTypes().forEach( ( block ) => {
		unregisterBlockType( block.name );
	} );
} );

describe( 'Latest Posts block', () => {
	afterEach( () => {
		apiFetch.mockReset();
	} );

	it( 'inserts block', async () => {
		const screen = await initializeEditor();

		// Mock return value for categories
		apiFetch.mockReturnValueOnce( Promise.resolve( [] ) );

		// Add block
		await addBlock( screen, 'Latest Posts' );

		// Get block
		const latestPostsBlock = await getBlock( screen, 'Latest Posts' );
		expect( latestPostsBlock ).toBeVisible();
		expect( getEditorHtml() ).toMatchSnapshot();
	} );
} );
