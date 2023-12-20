/**
 * External dependencies
 */
import { getEditorHtml, initializeEditor, fireEvent } from 'test/helpers';

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

describe( 'Shortcode block', () => {
	it( 'inserts block', async () => {
		const screen = await initializeEditor();

		fireEvent.press( screen.getByLabelText( 'Add block' ) );

		const blockList = screen.getByTestId( 'InserterUI-Blocks' );
		// onScroll event used to force the FlatList to render all items
		fireEvent.scroll( blockList, {
			nativeEvent: {
				contentOffset: { y: 0, x: 0 },
				contentSize: { width: 100, height: 100 },
				layoutMeasurement: { width: 100, height: 100 },
			},
		} );

		fireEvent.press( await screen.findByText( 'Shortcode' ) );

		const [ shortcodeBlock ] = screen.getAllByLabelText(
			/Shortcode Block\. Row 1/
		);
		expect( shortcodeBlock ).toBeVisible();
		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'edits content', async () => {
		const screen = await initializeEditor( {
			initialHtml: '<!-- wp:shortcode /-->',
		} );
		const [ shortcodeBlock ] = screen.getAllByLabelText(
			/Shortcode Block\. Row 1/
		);
		fireEvent.press( shortcodeBlock );

		const textField = screen.getByPlaceholderText( 'Add a shortcode…' );
		fireEvent( textField, 'focus' );
		fireEvent( textField, 'onChange', {
			nativeEvent: {
				eventCount: 1,
				target: undefined,
				text: '[youtube https://www.youtube.com/watch?v=ssfHW5lwFZg]',
			},
		} );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );
} );
