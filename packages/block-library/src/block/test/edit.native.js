/**
 * External dependencies
 */
import {
	getEditorHtml,
	initializeEditor,
	fireEvent,
	within,
	setupApiFetch,
	triggerBlockListLayout,
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
    <h2 class="wp-block-heading">First Reusable block</h2>
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
	meta: { footnotes: '' },
	wp_pattern_category: [],
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

describe( 'Synced patterns', () => {
	it( 'inserts a synced pattern', async () => {
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
			} else if (
				path.startsWith( '/wp/v2/block-patterns/categories' )
			) {
				response = [];
			}
			return Promise.resolve( response );
		} );

		const screen = await initializeEditor( {
			initialHtml: '',
			capabilities: { reusableBlock: true },
		} );

		// Open the inserter menu.
		fireEvent.press( await screen.findByLabelText( 'Add block' ) );

		// Navigate to reusable tab.
		const reusableSegment = await screen.findByText( 'Synced patterns' );
		// onLayout event is required by Segment component.
		fireEvent( reusableSegment, 'layout', {
			nativeEvent: {
				layout: {
					width: 100,
				},
			},
		} );
		fireEvent.press( reusableSegment );

		const reusableBlockList = screen.getByTestId(
			'InserterUI-SyncedPatterns'
		);
		// onScroll event used to force the FlatList to render all items.
		fireEvent.scroll( reusableBlockList, {
			nativeEvent: {
				contentOffset: { y: 0, x: 0 },
				contentSize: { width: 100, height: 100 },
				layoutMeasurement: { width: 100, height: 100 },
			},
		} );

		// Insert a reusable block.
		fireEvent.press( await screen.findByText( `Reusable block - 1` ) );

		// Get the reusable block.
		const [ reusableBlock ] = await screen.findAllByLabelText(
			/Pattern Block\. Row 1/
		);

		expect( reusableBlock ).toBeDefined();
		expect( getEditorHtml() ).toBe( '<!-- wp:block {"ref":1} /-->' );
	} );

	it( 'renders warning when the block does not exist', async () => {
		// We have to use different ids because entities are cached in memory.
		const id = 3;
		const initialHtml = `<!-- wp:block {"ref":${ id }} /-->`;

		const screen = await initializeEditor( {
			initialHtml,
		} );

		const [ reusableBlock ] = await screen.findAllByLabelText(
			/Pattern Block\. Row 1/
		);

		const blockDeleted = within( reusableBlock ).getByText(
			'Block has been deleted or is unavailable.'
		);

		expect( reusableBlock ).toBeDefined();
		expect( blockDeleted ).toBeDefined();
	} );

	it( 'renders block content', async () => {
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
			return Promise.resolve( {
				json: () => Promise.resolve( response ),
			} );
		} );

		const screen = await initializeEditor( {
			initialHtml,
		} );

		const reusableBlock = await screen.findByLabelText(
			/Pattern Block\. Row 1/
		);

		const innerBlockListWrapper =
			await within( reusableBlock ).findByTestId( 'block-list-wrapper' );

		// onLayout event has to be explicitly dispatched in BlockList component,
		// otherwise the inner blocks are not rendered.
		fireEvent( innerBlockListWrapper, 'layout', {
			nativeEvent: {
				layout: {
					width: 100,
				},
			},
		} );

		const [ headingInnerBlock ] = await within(
			reusableBlock
		).findAllByLabelText(
			'Heading Block. Row 1. Level 2. First Reusable block'
		);

		expect( reusableBlock ).toBeDefined();
		expect( headingInnerBlock ).toBeDefined();
	} );

	it( 'renders block after content is updated due to a side effect', async () => {
		// We have to use different ids because entities are cached in memory.
		const id = 5;
		const initialHtml = `<!-- wp:block {"ref":${ id }} /-->`;
		const endpoint = `/wp/v2/blocks/${ id }`;
		const fetchMedia = {
			request: {
				path: `/wp/v2/media/1?context=edit`,
			},
			response: {
				source_url: 'https://cldup.com/cXyG__fTLN.jpg',
				id: 1,
				// We need to include the sizes to trigger the side effect.
				media_details: {
					sizes: {
						large: {
							source_url:
								'https://cldup.com/cXyG__fTLN.jpg?w=500',
						},
					},
				},
			},
		};

		// Return mocked response for the block endpoint.
		fetchRequest.mockImplementation( ( { path } ) => {
			let response = {};
			if ( path.startsWith( endpoint ) ) {
				response = getMockedReusableBlock( id );
			}
			// Replace content with an Image block to trigger a side effect.
			// The side effect will be produced when the `source` attribute is replaced
			// with an URL that includes the width query parameter:
			// https://cldup.com/cXyG__fTLN.jpg => https://cldup.com/cXyG__fTLN.jpg?w=500
			response.content.raw = `<!-- wp:image {"id":1,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://cldup.com/cXyG__fTLN.jpg" alt="" class="wp-image-1"/></figure>
<!-- /wp:image -->`;
			return Promise.resolve( {
				json: () => Promise.resolve( response ),
			} );
		} );

		const screen = await initializeEditor( {
			initialHtml,
		} );

		const reusableBlock = await screen.findByLabelText(
			/Pattern Block\. Row 1/
		);

		// Mock media fetch requests
		setupApiFetch( [ fetchMedia ] );

		await triggerBlockListLayout(
			within( reusableBlock ).getByTestId( 'block-list-wrapper' )
		);

		const imageBlock =
			await within( reusableBlock ).getByLabelText(
				'Image Block. Row 1'
			);

		expect( reusableBlock ).toBeDefined();
		expect( imageBlock ).toBeDefined();
	} );
} );
