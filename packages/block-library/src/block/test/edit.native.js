/**
 * External dependencies
 */
import { cleanup, fireEvent, waitFor } from '@testing-library/react-native';

/**
 * WordPress dependencies
 */
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import { fetchRequest } from '@wordpress/react-native-bridge';

/**
 * Internal dependencies
 */
import { initializeEditor } from 'test/helpers';
import { getReusableBlock } from './fixture';

beforeAll( () => {
	// Setup API fetch as it's done when initializing the editor
	require( '@wordpress/react-native-editor/src/api-fetch-setup' ).default();
	// Register all core blocks
	require( '@wordpress/block-library' ).registerCoreBlocks();
} );

afterAll( () => {
	// Clean up registered blocks
	getBlockTypes().forEach( ( block ) => {
		unregisterBlockType( block.name );
	} );
} );

afterEach( cleanup );

// The skipped tests below pass but are currently skipped because multiple
// async findBy* queries currently cause errors in test output
// https://git.io/JYYGE
// eslint-disable-next-line jest/no-disabled-tests
describe.skip( 'Reusable block', () => {
	it( 'renders warning when the block does not exist', async () => {
		// We have to use different ids because entities are cached in memory.
		const id = 1;
		const initialHtml = `<!-- wp:block {"ref":${ id }} /-->`;
		const endpoint = `/wp/v2/blocks/${ id }`;

		const result = await initializeEditor( { initialHtml } );
		const { getBlockAtPosition, getByText } = result;

		// Wait for the block to be fetched.
		await waitFor( () => {
			const isBlockFetched = fetchRequest.mock.calls.find( ( call ) =>
				call[ 0 ].startsWith( endpoint )
			);
			expect( isBlockFetched ).toBeTruthy();
		} );

		expect( getBlockAtPosition( 'Reusable block' ) ).toBeDefined();
		expect(
			getByText( 'Block has been deleted or is unavailable.' )
		).toBeDefined();

		expect( global.getEditorHtml() ).toBe( initialHtml );
	} );

	it( 'renders block content', async () => {
		// We have to use different ids because entities are cached in memory.
		const id = 2;
		const initialHtml = `<!-- wp:block {"ref":${ id }} /-->`;
		const endpoint = `/wp/v2/blocks/${ id }`;

		fetchRequest.mockImplementation( ( path ) => {
			if ( path.startsWith( endpoint ) ) {
				return Promise.resolve(
					JSON.stringify( getReusableBlock( id ) )
				);
			}
		} );

		const result = await initializeEditor( { initialHtml } );
		const { getBlockAtPosition } = result;

		// Wait for the block to be fetched.
		await waitFor( () => {
			const hasFetchedBlock = fetchRequest.mock.calls.find( ( call ) =>
				call[ 0 ].startsWith( endpoint )
			);
			expect( hasFetchedBlock ).toBeTruthy();
		} );

		const reusableBlock = await getBlockAtPosition( 'Reusable block' );
		const innerBlockListWrapper = reusableBlock.findByProps( {
			accessibilityLabel: 'block-list-wrapper',
		} );
		// onLayout event has to be explicitly dispatched in BlockList component,
		// otherwise the inner blocks are not rendered.
		fireEvent( innerBlockListWrapper, 'layout', {
			nativeEvent: {
				layout: {
					width: 100,
				},
			},
		} );

		const headingInnerBlock = reusableBlock.findByProps( {
			accessibilityLabel:
				'Heading Block. Row 1. Level 2. First Reusable block',
		} );
		expect( headingInnerBlock ).toBeDefined();

		expect( global.getEditorHtml() ).toBe( initialHtml );
	} );
} );
