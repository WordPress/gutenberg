/**
 * External dependencies
 */
import {
	getEditorHtml,
	initializeEditor,
	fireEvent,
	waitFor,
	// eslint-disable-next-line import/no-unresolved
} from 'test/helpers';

/**
 * WordPress dependencies
 */
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';

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

describe( 'Test cases', () => {
	it( 'Test if a block is rendered', async () => {
		const initialHtml = `<!-- wp:paragraph -->\n<p>Test</p>\n<!-- /wp:paragraph -->`;

		// Initialize the editor
		const { getByA11yLabel } = await initializeEditor( {
			initialHtml,
		} );

		// Get the paragraph block
		const paragraphBlock = await waitFor( () =>
			getByA11yLabel( /Paragraph Block\. Row 1/ )
		);

		expect( paragraphBlock ).toBeDefined();
		expect( getEditorHtml() ).toBe( initialHtml );
	} );

	it( 'Test if a block is inserted', async () => {
		// Initialize the editor
		const {
			getByA11yLabel,
			getByTestId,
			getByText,
		} = await initializeEditor( {
			initialHtml: '',
		} );

		// Open the inserter menu
		fireEvent.press( await waitFor( () => getByA11yLabel( 'Add block' ) ) );

		const blockList = getByTestId( 'InserterUI-Blocks' );
		// onScroll event used to force the FlatList to render all items
		fireEvent.scroll( blockList, {
			nativeEvent: {
				contentOffset: { y: 0, x: 0 },
				contentSize: { width: 100, height: 100 },
				layoutMeasurement: { width: 100, height: 100 },
			},
		} );

		// Insert a Paragraph block
		fireEvent.press( await waitFor( () => getByText( `Paragraph` ) ) );

		// Get the paragraph block
		const paragraphBlock = await waitFor( () =>
			getByA11yLabel( /Paragraph Block\. Row 1/ )
		);

		expect( paragraphBlock ).toBeDefined();
		expect( getEditorHtml() ).toBe(
			'<!-- wp:paragraph -->\n<p></p>\n<!-- /wp:paragraph -->'
		);
	} );

	it( 'Test block settings', async () => {
		const initialHtml = `<!-- wp:spacer -->\n<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>\n<!-- /wp:spacer -->`;

		// Initialize the editor
		const { getByA11yLabel, getByTestId } = await initializeEditor( {
			initialHtml,
		} );

		// Get the Spacer block
		const spacerBlock = await waitFor( () =>
			getByA11yLabel( /Spacer Block\. Row 1/ )
		);

		// Select the Spacer block
		fireEvent.press( spacerBlock );

		// Open block settings
		fireEvent.press( getByA11yLabel( 'Open Settings' ) );

		const heightSlider = await waitFor( () =>
			getByTestId( 'Slider Height in pixels' )
		);
		fireEvent( heightSlider, 'valueChange', '50' );

		expect( getEditorHtml() ).toBe(
			'<!-- wp:spacer {"height":50} -->\n<div style="height:50px" aria-hidden="true" class="wp-block-spacer"></div>\n<!-- /wp:spacer -->'
		);
	} );

	it( 'Test block actions menu', async () => {
		const initialHtml = `<!-- wp:spacer -->\n<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>\n<!-- /wp:spacer -->`;

		// Initialize the editor
		const { getByA11yLabel, getByText } = await initializeEditor( {
			initialHtml,
		} );

		// Get the Spacer block
		const spacerBlock = await waitFor( () =>
			getByA11yLabel( /Spacer Block\. Row 1/ )
		);

		// Select the Spacer block
		fireEvent.press( spacerBlock );

		// Open block actions menu
		fireEvent.press( getByA11yLabel( 'Open Block Actions Menu' ) );

		// Duplicate block
		fireEvent.press( getByText( 'Duplicate block' ) );

		expect( getEditorHtml() ).toBe(
			[
				'<!-- wp:spacer -->\n<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>\n<!-- /wp:spacer -->',
				'<!-- wp:spacer -->\n<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>\n<!-- /wp:spacer -->',
			].join( '\n\n' )
		);
	} );
} );
