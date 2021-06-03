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
	// Register all core blocks
	registerCoreBlocks();
} );

afterAll( () => {
	// Clean up registered blocks
	getBlockTypes().forEach( ( block ) => {
		unregisterBlockType( block.name );
	} );
} );

describe( 'Reusable block', () => {
	it( 'renders warning when the block does not exist', async () => {
		// We have to use different ids because entities are cached in memory.
		const id = 1;
		const initialHtml = `<!-- wp:block {"ref":${ id }} /-->`;
		const endpoint = `/wp/v2/blocks/${ id }`;

		const { getByA11yLabel } = await initializeEditor( {
			initialHtml,
		} );

		const reusableBlock = await waitFor( () =>
			getByA11yLabel( /Reusable block Block\. Row 1/ )
		);

		const reusableBlockRequest = fetchRequest.mock.calls.find( ( call ) =>
			call[ 0 ].path.startsWith( endpoint )
		);

		const blockDeleted = await waitFor( () =>
			within( reusableBlock ).getByText(
				'Block has been deleted or is unavailable.'
			)
		);

		expect( reusableBlockRequest ).toBeDefined();
		expect( reusableBlock ).toBeDefined();
		expect( blockDeleted ).toBeDefined();
		expect( getEditorHtml() ).toBe( initialHtml );
	} );

	it( 'renders block content', async () => {
		// We have to use different ids because entities are cached in memory.
		const id = 2;
		const initialHtml = `<!-- wp:block {"ref":${ id }} /-->`;
		const endpoint = `/wp/v2/blocks/${ id }`;

		// Return mocked response for the block endpoint.
		fetchRequest.mockImplementation( ( { path } ) => {
			if ( path.startsWith( endpoint ) ) {
				return Promise.resolve( getMockedReusableBlock( id ) );
			}
		} );

		const { getByA11yLabel } = await initializeEditor( {
			initialHtml,
		} );

		const reusableBlock = await waitFor( () =>
			getByA11yLabel( /Reusable block Block\. Row 1/ )
		);

		const reusableBlockRequest = fetchRequest.mock.calls.find( ( call ) =>
			call[ 0 ].path.startsWith( endpoint )
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

		const headingInnerBlock = waitFor( () =>
			within( reusableBlock ).getByA11yLabel(
				'Heading Block. Row 1. Level 2. First Reusable block'
			)
		);

		expect( reusableBlockRequest ).toBeDefined();
		expect( reusableBlock ).toBeDefined();
		expect( headingInnerBlock ).toBeDefined();
		expect( getEditorHtml() ).toBe( initialHtml );
	} );
} );
