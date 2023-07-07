/**
 * External dependencies
 */
import {
	addBlock,
	fireEvent,
	getEditorHtml,
	within,
	getBlock,
	initializeEditor,
	triggerBlockListLayout,
	typeInRichText,
	waitFor,
} from 'test/helpers';

/**
 * WordPress dependencies
 */
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';
import { BACKSPACE } from '@wordpress/keycodes';

const BUTTONS_HTML = `<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button /--></div>
<!-- /wp:buttons -->`;

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

describe( 'Buttons block', () => {
	describe( 'when a button is shown', () => {
		it( 'adjusts the border radius', async () => {
			const initialHtml = `<!-- wp:buttons -->
			<div class="wp-block-buttons"><!-- wp:button {"style":{"border":{"radius":"5px"}}} -->
			<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" style="border-radius:5px" >Hello</a></div>
			<!-- /wp:button --></div>
			<!-- /wp:buttons -->`;
			const editor = await initializeEditor( {
				initialHtml,
			} );

			const [ buttonsBlock ] = await editor.findAllByLabelText(
				/Buttons Block\. Row 1/
			);
			fireEvent.press( buttonsBlock );

			// onLayout event has to be explicitly dispatched in BlockList component,
			// otherwise the inner blocks are not rendered.
			const innerBlockListWrapper = await within(
				buttonsBlock
			).findByTestId( 'block-list-wrapper' );
			fireEvent( innerBlockListWrapper, 'layout', {
				nativeEvent: {
					layout: {
						width: 100,
					},
				},
			} );

			const [ buttonInnerBlock ] = await within(
				buttonsBlock
			).findAllByLabelText( /Button Block\. Row 1/ );
			fireEvent.press( buttonInnerBlock );

			const settingsButton = await editor.findByLabelText(
				'Open Settings'
			);
			fireEvent.press( settingsButton );

			const radiusStepper = await editor.findByLabelText(
				/Border Radius/
			);

			const incrementButton = await within( radiusStepper ).findByTestId(
				'Increment',
				{ hidden: true }
			);
			fireEvent( incrementButton, 'onPressIn' );

			expect( getEditorHtml() ).toMatchSnapshot();
		} );

		it( 'adds another button using the inline appender', async () => {
			const screen = await initializeEditor( {
				initialHtml: BUTTONS_HTML,
			} );

			// Get block
			const buttonsBlock = await getBlock( screen, 'Buttons' );

			// Trigger inner blocks layout
			const innerBlockListWrapper = await within(
				buttonsBlock
			).findByTestId( 'block-list-wrapper' );
			fireEvent( innerBlockListWrapper, 'layout', {
				nativeEvent: {
					layout: {
						width: 300,
					},
				},
			} );

			// Get inner button block
			const buttonBlock = await getBlock( screen, 'Button' );
			fireEvent.press( buttonBlock );

			// Add another Button using the inline appender
			const appenderButton =
				within( buttonsBlock ).getByTestId( 'appender-button' );
			fireEvent.press( appenderButton );

			// Check for new button
			const [ secondButtonBlock ] = await within(
				buttonsBlock
			).findAllByLabelText( /Button Block\. Row 2/ );
			expect( secondButtonBlock ).toBeVisible();

			// Add a Paragraph block using the empty placeholder at the bottom
			const paragraphPlaceholder = await screen.findByLabelText(
				'Add paragraph block'
			);
			fireEvent.press( paragraphPlaceholder );

			// Check for inline appenders
			const appenderButtons =
				within( buttonsBlock ).queryAllByTestId( 'appender-button' );
			expect( appenderButtons.length ).toBe( 0 );

			expect( getEditorHtml() ).toMatchSnapshot();
		} );

		it( 'adds another button using the inserter', async () => {
			const screen = await initializeEditor( {
				initialHtml: BUTTONS_HTML,
			} );

			// Get block
			const buttonsBlock = await getBlock( screen, 'Buttons' );
			fireEvent.press( buttonsBlock );

			// Trigger inner blocks layout
			const innerBlockListWrapper = await within(
				buttonsBlock
			).findByTestId( 'block-list-wrapper' );
			fireEvent( innerBlockListWrapper, 'layout', {
				nativeEvent: {
					layout: {
						width: 300,
					},
				},
			} );

			// Get inner button block
			const buttonBlock = await getBlock( screen, 'Button' );
			fireEvent.press( buttonBlock );

			// Open the block inserter
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

			// Check the Add block here placeholder is not visible
			const addBlockHerePlaceholders =
				screen.queryAllByLabelText( 'ADD BLOCK HERE' );
			expect( addBlockHerePlaceholders.length ).toBe( 0 );

			// Add a new Button block
			fireEvent.press( within( blockList ).getByText( 'Button' ) );

			// Get new button
			const secondButtonBlock = await getBlock( screen, 'Button', {
				rowIndex: 2,
			} );
			const secondButtonInput =
				within( secondButtonBlock ).getByLabelText(
					'Text input. Empty'
				);
			typeInRichText( secondButtonInput, 'Hello!' );

			expect( getEditorHtml() ).toMatchSnapshot();
		} );

		describe( 'removing button along with buttons block', () => {
			it( 'removes the button and buttons block when deleting the block using the block delete action', async () => {
				const screen = await initializeEditor( {
					initialHtml: BUTTONS_HTML,
				} );

				// Get block
				const buttonsBlock = await getBlock( screen, 'Buttons' );

				// Trigger inner blocks layout
				const innerBlockListWrapper = await within(
					buttonsBlock
				).findByTestId( 'block-list-wrapper' );
				fireEvent( innerBlockListWrapper, 'layout', {
					nativeEvent: {
						layout: {
							width: 300,
						},
					},
				} );

				// Get inner button block
				const buttonBlock = await getBlock( screen, 'Button' );
				fireEvent.press( buttonBlock );

				// Open block actions menu
				const blockActionsButton = screen.getByLabelText(
					/Open Block Actions Menu/
				);
				fireEvent.press( blockActionsButton );

				// Delete block
				const deleteButton = screen.getByLabelText( /Remove block/ );
				fireEvent.press( deleteButton );

				expect( getEditorHtml() ).toMatchSnapshot();
			} );

			it( 'removes the button and buttons block when deleting the block using the delete (backspace) key', async () => {
				const screen = await initializeEditor( {
					initialHtml: BUTTONS_HTML,
				} );

				// Get block
				const buttonsBlock = await getBlock( screen, 'Buttons' );
				triggerBlockListLayout( buttonsBlock );

				// Get inner button block
				const buttonBlock = await getBlock( screen, 'Button' );
				fireEvent.press( buttonBlock );

				const buttonInput =
					within( buttonBlock ).getByLabelText( 'Text input. Empty' );

				// Delete block
				fireEvent( buttonInput, 'onKeyDown', {
					nativeEvent: {},
					preventDefault() {},
					keyCode: BACKSPACE,
				} );

				expect( getEditorHtml() ).toMatchSnapshot();
			} );
		} );
	} );

	describe( 'justify content', () => {
		[
			'Justify items left',
			'Justify items center',
			'Justify items right',
		].forEach( ( justificationOption ) =>
			it( `sets ${ justificationOption } option`, async () => {
				const initialHtml = `<!-- wp:buttons -->
				<div class="wp-block-buttons"><!-- wp:button /--></div>
				<!-- /wp:buttons -->`;
				const screen = await initializeEditor( { initialHtml } );

				const [ block ] = await screen.findAllByLabelText(
					/Buttons Block\. Row 1/
				);
				fireEvent.press( block );

				fireEvent.press(
					screen.getByLabelText( 'Change items justification' )
				);

				// Select alignment option.
				fireEvent.press(
					await screen.findByText( justificationOption )
				);

				expect( getEditorHtml() ).toMatchSnapshot();
			} )
		);
	} );

	describe( 'color customization', () => {
		it( 'sets a text color', async () => {
			// Arrange
			const screen = await initializeEditor();
			await addBlock( screen, 'Buttons' );

			// Act
			const buttonsBlock = getBlock( screen, 'Buttons' );
			fireEvent.press( buttonsBlock );

			// Trigger onLayout for the list
			await triggerBlockListLayout( buttonsBlock );

			const buttonBlock = await getBlock( screen, 'Button' );
			fireEvent.press( buttonBlock );

			// Open Block Settings.
			fireEvent.press( screen.getByLabelText( 'Open Settings' ) );

			// Wait for Block Settings to be visible.
			const blockSettingsModal = screen.getByTestId(
				'block-settings-modal'
			);
			await waitFor( () => blockSettingsModal.props.isVisible );

			// Open Text color settings
			fireEvent.press( screen.getByLabelText( 'Text, Default' ) );

			// Tap one color
			fireEvent.press( screen.getByLabelText( 'Pale pink' ) );

			// Dismiss the Block Settings modal.
			fireEvent( blockSettingsModal, 'backdropPress' );

			// Assert
			expect( getEditorHtml() ).toMatchSnapshot();
		} );

		it( 'sets a background color', async () => {
			// Arrange
			const screen = await initializeEditor();
			await addBlock( screen, 'Buttons' );

			// Act
			const buttonsBlock = getBlock( screen, 'Buttons' );
			fireEvent.press( buttonsBlock );

			// Trigger onLayout for the list
			await triggerBlockListLayout( buttonsBlock );

			const buttonBlock = await getBlock( screen, 'Button' );
			fireEvent.press( buttonBlock );

			// Open Block Settings.
			fireEvent.press( screen.getByLabelText( 'Open Settings' ) );

			// Wait for Block Settings to be visible.
			const blockSettingsModal = screen.getByTestId(
				'block-settings-modal'
			);
			await waitFor( () => blockSettingsModal.props.isVisible );

			// Open Text color settings
			fireEvent.press( screen.getByLabelText( 'Background, Default' ) );

			// Tap one color
			fireEvent.press( screen.getByLabelText( 'Luminous vivid amber' ) );

			// Dismiss the Block Settings modal.
			fireEvent( blockSettingsModal, 'backdropPress' );

			// Assert
			expect( getEditorHtml() ).toMatchSnapshot();
		} );

		it( 'sets a gradient background color', async () => {
			// Arrange
			const screen = await initializeEditor();
			await addBlock( screen, 'Buttons' );

			// Act
			const buttonsBlock = getBlock( screen, 'Buttons' );
			fireEvent.press( buttonsBlock );

			// Trigger onLayout for the list
			await triggerBlockListLayout( buttonsBlock );

			const buttonBlock = await getBlock( screen, 'Button' );
			fireEvent.press( buttonBlock );

			// Open Block Settings.
			fireEvent.press( screen.getByLabelText( 'Open Settings' ) );

			// Wait for Block Settings to be visible.
			const blockSettingsModal = screen.getByTestId(
				'block-settings-modal'
			);
			await waitFor( () => blockSettingsModal.props.isVisible );

			// Open Text color settings
			fireEvent.press( screen.getByLabelText( 'Background, Default' ) );

			// Tap on the gradient segment
			fireEvent.press( screen.getByLabelText( 'Gradient' ) );

			// Tap one gradient color
			fireEvent.press(
				screen.getByLabelText( 'Light green cyan to vivid green cyan' )
			);

			// Dismiss the Block Settings modal.
			fireEvent( blockSettingsModal, 'backdropPress' );

			// Assert
			expect( getEditorHtml() ).toMatchSnapshot();
		} );
	} );
} );
