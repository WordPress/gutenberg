/**
 * External dependencies
 */
import {
	fireEvent,
	getEditorHtml,
	initializeEditor,
	waitFor,
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

describe( 'Spacer block', () => {
	it( 'inserts block', async () => {
		const { getByLabelText, getByTestId, getByText } =
			await initializeEditor();

		fireEvent.press( getByLabelText( 'Add block' ) );

		const blockList = getByTestId( 'InserterUI-Blocks' );
		// onScroll event used to force the FlatList to render all items
		fireEvent.scroll( blockList, {
			nativeEvent: {
				contentOffset: { y: 0, x: 0 },
				contentSize: { width: 100, height: 100 },
				layoutMeasurement: { width: 100, height: 100 },
			},
		} );

		fireEvent.press( await waitFor( () => getByText( 'Spacer' ) ) );

		expect( getByLabelText( /Spacer Block\. Row 1/ ) ).toBeVisible();
		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'updates height to 50px', async () => {
		const initialHtml = `<!-- wp:spacer -->
		<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
		<!-- /wp:spacer -->`;
		const { getByLabelText, getByDisplayValue, getByTestId, getByText } =
			await initializeEditor( {
				initialHtml,
			} );

		// Select Spacer block
		const spacerBlock = getByLabelText( /Spacer Block\. Row 1/ );
		fireEvent.press( spacerBlock );

		// Open block settings
		fireEvent.press( getByLabelText( 'Open Settings' ) );
		await waitFor(
			() => getByTestId( 'block-settings-modal' ).props.isVisible
		);

		// Update height attribute
		fireEvent.press( getByText( '100' ) );
		const heightTextInput = getByDisplayValue( '100' );
		fireEvent.changeText( heightTextInput, '50' );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'updates height to 25vh', async () => {
		const initialHtml = `<!-- wp:spacer -->
		<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
		<!-- /wp:spacer -->`;
		const { getByLabelText, getByDisplayValue, getByTestId, getByText } =
			await initializeEditor( {
				initialHtml,
			} );

		// Select Spacer block
		const spacerBlock = getByLabelText( /Spacer Block\. Row 1/ );
		fireEvent.press( spacerBlock );

		// Open block settings
		fireEvent.press( getByLabelText( 'Open Settings' ) );
		await waitFor(
			() => getByTestId( 'block-settings-modal' ).props.isVisible
		);

		// Set vh unit
		fireEvent.press( getByText( 'px' ) );
		fireEvent.press( getByText( 'Viewport height (vh)' ) );

		// Update height attribute
		fireEvent.press( getByText( '100' ) );
		const heightTextInput = getByDisplayValue( '100' );
		fireEvent.changeText( heightTextInput, '25' );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'increments height', async () => {
		const initialHtml = `<!-- wp:spacer -->
		<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
		<!-- /wp:spacer -->`;
		const { getByLabelText, getByTestId } = await initializeEditor( {
			initialHtml,
		} );

		// Select Spacer block
		const spacerBlock = getByLabelText( /Spacer Block\. Row 1/ );
		fireEvent.press( spacerBlock );

		// Open block settings
		fireEvent.press( getByLabelText( 'Open Settings' ) );
		await waitFor(
			() => getByTestId( 'block-settings-modal' ).props.isVisible
		);

		// Increment height
		fireEvent(
			getByLabelText( /Height\. Value is 100 Pixels \(px\)/ ),
			'accessibilityAction',
			{
				nativeEvent: { actionName: 'increment' },
			}
		);

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'decrements height', async () => {
		const initialHtml = `<!-- wp:spacer -->
		<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
		<!-- /wp:spacer -->`;
		const { getByLabelText, getByTestId } = await initializeEditor( {
			initialHtml,
		} );

		// Select Spacer block
		const spacerBlock = getByLabelText( /Spacer Block\. Row 1/ );
		fireEvent.press( spacerBlock );

		// Open block settings
		fireEvent.press( getByLabelText( 'Open Settings' ) );
		await waitFor(
			() => getByTestId( 'block-settings-modal' ).props.isVisible
		);

		// Increment height
		fireEvent(
			getByLabelText( /Height\. Value is 100 Pixels \(px\)/ ),
			'accessibilityAction',
			{
				nativeEvent: { actionName: 'decrement' },
			}
		);

		expect( getEditorHtml() ).toMatchSnapshot();
	} );
} );
