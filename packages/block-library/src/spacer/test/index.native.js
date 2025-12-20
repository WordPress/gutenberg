/**
 * External dependencies
 */
import {
	fireEvent,
	getEditorHtml,
	initializeEditor,
	waitForModalVisible,
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

		fireEvent.press( screen.getByText( 'Spacer' ) );

		const [ spacerBlock ] =
			screen.getAllByLabelText( /Spacer Block\. Row 1/ );
		expect( spacerBlock ).toBeVisible();
		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'updates height to 50px', async () => {
		const initialHtml = `<!-- wp:spacer -->
		<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
		<!-- /wp:spacer -->`;
		const screen = await initializeEditor( {
			initialHtml,
		} );

		// Select Spacer block
		const [ spacerBlock ] =
			screen.getAllByLabelText( /Spacer Block\. Row 1/ );
		fireEvent.press( spacerBlock );

		// Open block settings
		fireEvent.press( screen.getByLabelText( 'Open Settings' ) );
		const blockSettingsModal = screen.getByTestId( 'block-settings-modal' );
		await waitForModalVisible( blockSettingsModal );

		// Update height attribute
		fireEvent.press( screen.getByText( '100', { hidden: true } ) );
		const heightTextInput = screen.getByDisplayValue( '100', {
			hidden: true,
		} );
		fireEvent.changeText( heightTextInput, '50' );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'updates height to 25vh', async () => {
		const initialHtml = `<!-- wp:spacer -->
		<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
		<!-- /wp:spacer -->`;
		const screen = await initializeEditor( {
			initialHtml,
		} );

		// Select Spacer block
		const [ spacerBlock ] =
			screen.getAllByLabelText( /Spacer Block\. Row 1/ );
		fireEvent.press( spacerBlock );

		// Open block settings
		fireEvent.press( screen.getByLabelText( 'Open Settings' ) );
		const blockSettingsModal = screen.getByTestId( 'block-settings-modal' );
		await waitForModalVisible( blockSettingsModal );

		// Set vh unit
		fireEvent.press( screen.getByText( 'px', { hidden: true } ) );
		fireEvent.press(
			screen.getByText( 'Viewport height (vh)', { hidden: true } )
		);

		// Update height attribute
		fireEvent.press( screen.getByText( '100', { hidden: true } ) );
		const heightTextInput = screen.getByDisplayValue( '100', {
			hidden: true,
		} );
		fireEvent.changeText( heightTextInput, '25' );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'increments height', async () => {
		const initialHtml = `<!-- wp:spacer -->
		<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
		<!-- /wp:spacer -->`;
		const screen = await initializeEditor( {
			initialHtml,
		} );

		// Select Spacer block
		const [ spacerBlock ] =
			screen.getAllByLabelText( /Spacer Block\. Row 1/ );
		fireEvent.press( spacerBlock );

		// Open block settings
		fireEvent.press( screen.getByLabelText( 'Open Settings' ) );
		const blockSettingsModal = screen.getByTestId( 'block-settings-modal' );
		await waitForModalVisible( blockSettingsModal );

		// Increment height
		fireEvent(
			screen.getByLabelText( /Height\. Value is 100 Pixels \(px\)/ ),
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
		const screen = await initializeEditor( {
			initialHtml,
		} );

		// Select Spacer block
		const [ spacerBlock ] =
			screen.getAllByLabelText( /Spacer Block\. Row 1/ );
		fireEvent.press( spacerBlock );

		// Open block settings
		fireEvent.press( screen.getByLabelText( 'Open Settings' ) );
		const blockSettingsModal = screen.getByTestId( 'block-settings-modal' );
		await waitForModalVisible( blockSettingsModal );

		// Increment height
		fireEvent(
			screen.getByLabelText( /Height\. Value is 100 Pixels \(px\)/ ),
			'accessibilityAction',
			{
				nativeEvent: { actionName: 'decrement' },
			}
		);

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'inserts block with spacingSizes preset', async () => {
		// Mock spacingSizes presets
		const RAW_STYLES = {
			typography: {
				fontSize: 16,
			},
		};
		const RAW_FEATURES = {
			spacing: {
				spacingSizes: {
					theme: [
						{
							size: '3.125rem',
							slug: '100',
							name: '100',
						},
						{
							size: '3.75rem',
							slug: '110',
							name: '110',
						},
					],
				},
			},
		};

		const initialHtml = `<!-- wp:spacer {"height":"var:preset|spacing|110"} -->
		<div style="height:var(--wp--preset--spacing--110)" aria-hidden="true" class="wp-block-spacer"></div>
		<!-- /wp:spacer -->`;
		const screen = await initializeEditor( {
			initialHtml,
			rawStyles: JSON.stringify( RAW_STYLES ),
			rawFeatures: JSON.stringify( RAW_FEATURES ),
		} );

		// Select Spacer block
		const [ spacerBlock ] =
			screen.getAllByLabelText( /Spacer Block\. Row 1/ );
		fireEvent.press( spacerBlock );

		// Open block settings
		fireEvent.press( screen.getByLabelText( 'Open Settings' ) );
		const blockSettingsModal = screen.getByTestId( 'block-settings-modal' );
		await waitForModalVisible( blockSettingsModal );

		// Update height attribute
		fireEvent.press( screen.getByText( '60', { hidden: true } ) );
		const heightTextInput = screen.getByDisplayValue( '60', {
			hidden: true,
		} );
		fireEvent.changeText( heightTextInput, '70' );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'inserts block with spacingSizes preset without matching global styles values', async () => {
		const initialHtml = `<!-- wp:spacer {"height":"var:preset|spacing|30"} -->
		<div style="height:var(--wp--preset--spacing--30)" aria-hidden="true" class="wp-block-spacer"></div>
		<!-- /wp:spacer -->`;
		const screen = await initializeEditor( {
			initialHtml,
		} );

		// Select Spacer block
		const [ spacerBlock ] =
			screen.getAllByLabelText( /Spacer Block\. Row 1/ );
		fireEvent.press( spacerBlock );

		// Open block settings
		fireEvent.press( screen.getByLabelText( 'Open Settings' ) );
		const blockSettingsModal = screen.getByTestId( 'block-settings-modal' );
		await waitForModalVisible( blockSettingsModal );

		// Update height attribute
		fireEvent.press( screen.getByText( '100', { hidden: true } ) );
		const heightTextInput = screen.getByDisplayValue( '100', {
			hidden: true,
		} );
		fireEvent.changeText( heightTextInput, '120' );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );
} );
