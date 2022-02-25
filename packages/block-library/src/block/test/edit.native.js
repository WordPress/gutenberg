/**
 * External dependencies
 */
import {
	getEditorHtml,
	initializeEditor,
	fireEvent,
	waitFor,
	within,
} from 'test/helpers';

/**
 * WordPress dependencies
 */
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import fetchRequest from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { registerCoreBlocks } from '../..';

const getMockedReusableBlock = ( id ) => ( {
	content: {
		raw: `
    <!-- wp:heading -->
    <h2>First Reusable block</h2>
    <!-- /wp:heading -->

    <!-- wp:paragraph -->
    <p><strong>Bold</strong> <em>Italic</em> <s>Striked</s> Superscript<sup>(1)</sup> Subscript<sub>(2)</sub> <a href="http://www.wordpress.org" target="_blank" rel="noreferrer noopener">Link</a></p>
    <!-- /wp:paragraph -->

    !-- wp:heading {"level":4} -->
    <h4>List</h4>
    <!-- /wp:heading -->

    <!-- wp:list -->
    <ul><li>First Item</li><li>Second Item</li><li>Third Item</li></ul>
    <!-- /wp:list -->
`,
	},
	id,
	title: { raw: `Reusable block - ${ id }` },
	type: 'wp_block',
} );

beforeAll( () => {
	// Register all core blocks.
	registerCoreBlocks();
} );

afterAll( () => {
	// Clean up registered blocks.
	getBlockTypes().forEach( ( block ) => {
		unregisterBlockType( block.name );
	} );
} );

describe( 'Reusable block', () => {
	it( 'inserts a reusable block', async () => {
		// We have to use different ids because entities are cached in memory.
		const reusableBlockMock1 = getMockedReusableBlock( 1 );
		const reusableBlockMock2 = getMockedReusableBlock( 2 );

		// Return mocked responses for the block endpoints.
		fetchRequest.mockImplementation( ( { path } ) => {
			let response = {};
			if ( path.startsWith( '/wp/v2/blocks?' ) ) {
				response = [ reusableBlockMock1, reusableBlockMock2 ];
			} else if ( path.startsWith( '/wp/v2/blocks/1' ) ) {
				response = reusableBlockMock1;
			}
			return Promise.resolve( response );
		} );

		const {
			getByA11yLabel,
			getByTestId,
			getByText,
		} = await initializeEditor( {
			initialHtml: '',
			capabilities: { reusableBlock: true },
		} );

		// Open the inserter menu.
		fireEvent.press( await waitFor( () => getByA11yLabel( 'Add block' ) ) );

		// Navigate to reusable tab.
		const reusableSegment = await waitFor( () => getByText( 'Reusable' ) );
		// onLayout event is required by Segment component.
		fireEvent( reusableSegment, 'layout', {
			nativeEvent: {
				layout: {
					width: 100,
				},
			},
		} );
		fireEvent.press( reusableSegment );

		const reusableBlockList = getByTestId( 'InserterUI-ReusableBlocks' );
		// onScroll event used to force the FlatList to render all items.
		fireEvent.scroll( reusableBlockList, {
			nativeEvent: {
				contentOffset: { y: 0, x: 0 },
				contentSize: { width: 100, height: 100 },
				layoutMeasurement: { width: 100, height: 100 },
			},
		} );

		// Insert a reusable block.
		fireEvent.press(
			await waitFor( () => getByText( `Reusable block - 1` ) )
		);

		// Get the reusable block.
		const reusableBlock = await waitFor( () =>
			getByA11yLabel( /Reusable block Block\. Row 1/ )
		);

		expect( reusableBlock ).toBeDefined();
		expect( getEditorHtml() ).toBe( '<!-- wp:block {"ref":1} /-->' );
	} );

	it( 'renders warning when the block does not exist', async () => {
		// We have to use different ids because entities are cached in memory.
		const id = 3;
		const initialHtml = `<!-- wp:block {"ref":${ id }} /-->`;

		const { getByA11yLabel } = await initializeEditor( {
			initialHtml,
		} );

		const reusableBlock = await waitFor( () =>
			getByA11yLabel( /Reusable block Block\. Row 1/ )
		);

		const blockDeleted = await waitFor( () =>
			within( reusableBlock ).getByText(
				'Block has been deleted or is unavailable.'
			)
		);

		expect( reusableBlock ).toBeDefined();
		expect( blockDeleted ).toBeDefined();
	} );

	// Skipped until `pointerEvents: 'none'` no longer erroneously prevents
	// triggering `onLayout*` on the element: https://git.io/JSHZt.
	it.skip( 'renders block content', async () => {
		// We have to use different ids because entities are cached in memory.
		const id = 4;
		const initialHtml = `<!-- wp:block {"ref":${ id }} /-->`;
		const endpoint = `/wp/v2/blocks/${ id }`;

		// Return mocked response for the block endpoint.
		fetchRequest.mockImplementation( ( { path } ) => {
			let response = {};
			if ( path.startsWith( endpoint ) ) {
				response = getMockedReusableBlock( id );
			}
			return Promise.resolve( response );
		} );

		const { getByA11yLabel } = await initializeEditor( {
			initialHtml,
		} );

		const reusableBlock = await waitFor( () =>
			getByA11yLabel( /Reusable block Block\. Row 1/ )
		);

		const innerBlockListWrapper = await waitFor( () =>
			within( reusableBlock ).getByTestId( 'block-list-wrapper' )
		);

		// onLayout event has to be explicitly dispatched in BlockList component,
		// otherwise the inner blocks are not rendered.
		fireEvent( innerBlockListWrapper, 'layout', {
			nativeEvent: {
				layout: {
					width: 100,
				},
			},
		} );

		const headingInnerBlock = await waitFor( () =>
			within( reusableBlock ).getByA11yLabel(
				'Heading Block. Row 1. Level 2. First Reusable block'
			)
		);

		expect( reusableBlock ).toBeDefined();
		expect( headingInnerBlock ).toBeDefined();
	} );
} );
