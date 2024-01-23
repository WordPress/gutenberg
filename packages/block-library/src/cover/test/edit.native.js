/**
 * External dependencies
 */
import { Image } from 'react-native';
import {
	getEditorHtml,
	initializeEditor,
	render,
	fireEvent,
	waitForModalVisible,
	within,
	getBlock,
	openBlockSettings,
	setupMediaPicker,
	setupPicker,
} from 'test/helpers';

/**
 * WordPress dependencies
 */
import { BottomSheetSettings, BlockEdit } from '@wordpress/block-editor';
import { SlotFillProvider } from '@wordpress/components';
import { setDefaultBlockName, unregisterBlockType } from '@wordpress/blocks';
import {
	requestMediaPicker,
	requestMediaEditor,
} from '@wordpress/react-native-bridge';

/**
 * Internal dependencies
 */
import { IMAGE_BACKGROUND_TYPE } from '../shared';
import * as paragraph from '../../paragraph';
import * as cover from '..';

// Avoid errors due to mocked stylesheet files missing required selectors.
jest.mock( '@wordpress/compose', () => ( {
	...jest.requireActual( '@wordpress/compose' ),
	withPreferredColorScheme: jest.fn( ( Component ) => ( props ) => (
		<Component
			{ ...props }
			preferredColorScheme={ {} }
			getStylesFromColorScheme={ jest.fn( () => ( {} ) ) }
		/>
	) ),
} ) );

const COVER_BLOCK_PLACEHOLDER_HTML = `<!-- wp:cover {"isDark":false} -->
<div class="wp-block-cover is-light"><span aria-hidden="true" class="wp-block-cover__background has-background-dim-100 has-background-dim"></span><div class="wp-block-cover__inner-container"></div></div>
<!-- /wp:cover -->`;
const COVER_BLOCK_SOLID_COLOR_HTML = `<!-- wp:cover {"overlayColor":"cyan-bluish-gray","isDark":false} -->
<div class="wp-block-cover is-light"><span aria-hidden="true" class="wp-block-cover__background has-cyan-bluish-gray-background-color has-background-dim-100 has-background-dim"></span><div class="wp-block-cover__inner-container"><!-- wp:paragraph {"align":"center","placeholder":"Write title…"} -->
<p class="has-text-align-center"></p>
<!-- /wp:paragraph --></div></div>
<!-- /wp:cover -->`;
const COVER_BLOCK_IMAGE_HTML = `<!-- wp:cover {"url":"https://cldup.com/cXyG__fTLN.jpg","id":10710,"dimRatio":50,"overlayColor":"foreground","isDark":false} -->
<div class="wp-block-cover is-light"><span aria-hidden="true" class="wp-block-cover__background has-foreground-background-color has-background-dim"></span><img class="wp-block-cover__image-background wp-image-10710" alt="" src="https://cldup.com/cXyG__fTLN.jpg" data-object-fit="cover"/><div class="wp-block-cover__inner-container"><!-- wp:paragraph {"align":"center","placeholder":"Write title…","fontSize":"large"} -->
<p class="has-text-align-center has-large-font-size"></p>
<!-- /wp:paragraph --></div></div>
<!-- /wp:cover -->`;
const COVER_BLOCK_CUSTOM_HEIGHT_HTML = `<!-- wp:cover {"url":"https://cldup.com/cXyG__fTLN.jpg","id":10710,"dimRatio":50,"overlayColor":"foreground","minHeight":20,"minHeightUnit":"vw","isDark":false} -->
<div class="wp-block-cover is-light" style="min-height:20vw"><span aria-hidden="true" class="wp-block-cover__background has-foreground-background-color has-background-dim"></span><img class="wp-block-cover__image-background wp-image-10710" alt="" src="https://cldup.com/cXyG__fTLN.jpg" data-object-fit="cover"/><div class="wp-block-cover__inner-container"><!-- wp:paragraph {"align":"center","placeholder":"Write title…","fontSize":"large"} -->
<p class="has-text-align-center has-large-font-size"></p>
<!-- /wp:paragraph --></div></div>
<!-- /wp:cover -->`;

const COLOR_PINK = '#f78da7';
const COLOR_RED = '#cf2e2e';
const COLOR_GRAY = '#abb8c3';
const GRADIENT_GREEN =
	'linear-gradient(135deg,rgb(122,220,180) 0%,rgb(0,208,130) 100%)';

const MEDIA_OPTIONS = [
	'Choose from device',
	'Take a Photo',
	'Take a Video',
	'WordPress Media Library',
];

// Simplified tree to render Cover edit within slot.
const CoverEdit = ( props ) => (
	<SlotFillProvider>
		<BlockEdit
			isSelected
			mayDisplayControls
			name={ cover.name }
			clientId={ 0 }
			{ ...props }
		/>
		<BottomSheetSettings isVisible />
	</SlotFillProvider>
);

const setAttributes = jest.fn();
const attributes = {
	backgroundType: IMAGE_BACKGROUND_TYPE,
	focalPoint: { x: '0.25', y: '0.75' },
	hasParallax: false,
	overlayColor: { color: '#000000' },
	url: 'mock-url',
};

beforeAll( () => {
	// Mock Image.getSize to avoid failed attempt to size non-existant image.
	const getSizeSpy = jest.spyOn( Image, 'getSize' );
	getSizeSpy.mockImplementation( ( _url, callback ) => callback( 300, 200 ) );

	// Register required blocks.
	paragraph.init();
	cover.init();
	setDefaultBlockName( paragraph.name );
} );

afterAll( () => {
	// Restore mocks.
	Image.getSize.mockRestore();

	// Clean up registered blocks.
	unregisterBlockType( paragraph.name );
	unregisterBlockType( cover.name );
} );

describe( 'when no media is attached', () => {
	it( 'adds an image or video', async () => {
		const { getByText, findByText } = render(
			<CoverEdit
				attributes={ {
					...attributes,
					url: undefined,
					backgroundType: undefined,
				} }
				setAttributes={ setAttributes }
			/>
		);
		fireEvent.press( getByText( 'Add image or video' ) );
		const mediaLibraryButton = await findByText(
			'WordPress Media Library'
		);
		fireEvent.press( mediaLibraryButton );

		expect( requestMediaPicker ).toHaveBeenCalled();
	} );
} );

describe( 'when no media is attached and overlay color is set', () => {
	it( 'adds image', async () => {
		const media = {
			type: 'image',
			id: 2000,
			url: 'https://test.files.wordpress.com/local-image-1.mp4',
		};
		const { mediaPickerCallback } = setupMediaPicker();
		const screen = await initializeEditor( {
			initialHtml: COVER_BLOCK_SOLID_COLOR_HTML,
		} );
		const { getByText } = screen;
		const { selectOption } = setupPicker( screen, MEDIA_OPTIONS );

		// Get block
		const coverBlock = await getBlock( screen, 'Cover' );
		fireEvent.press( coverBlock );

		// Open block settings
		await openBlockSettings( screen );

		fireEvent.press( getByText( 'Add image or video' ) );
		selectOption( 'WordPress Media Library' );
		await mediaPickerCallback( media );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );
} );

describe( 'when an image is attached', () => {
	it( 'edits the image', async () => {
		const screen = render(
			<CoverEdit
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
		);

		fireEvent.press( screen.getByLabelText( 'Edit image' ) );
		const editButton = await screen.findByText( 'Edit' );
		fireEvent.press( editButton );

		expect( requestMediaEditor ).toHaveBeenCalled();
	} );

	it( 'replaces the image', async () => {
		const screen = render(
			<CoverEdit
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
		);
		fireEvent.press( screen.getByLabelText( 'Edit image' ) );
		const replaceButton = await screen.findByText( 'Replace' );
		fireEvent.press( replaceButton );
		const mediaLibraryButton = await screen.findByText(
			'WordPress Media Library'
		);
		fireEvent.press( mediaLibraryButton );

		expect( requestMediaPicker ).toHaveBeenCalled();
	} );

	it( 'clears the image within image edit button', async () => {
		const screen = render(
			<CoverEdit
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
		);
		fireEvent.press( screen.getByLabelText( 'Edit image' ) );
		const [ clearMediaButton ] =
			await screen.findAllByText( 'Clear Media' );
		fireEvent.press( clearMediaButton );

		expect( setAttributes ).toHaveBeenCalledWith(
			expect.objectContaining( {
				focalPoint: undefined,
				hasParallax: undefined,
				id: undefined,
				url: undefined,
			} )
		);
	} );

	it( 'toggles a fixed background', async () => {
		const screen = render(
			<CoverEdit
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
		);
		const fixedBackgroundButton =
			await screen.findByText( 'Fixed background' );
		fireEvent.press( fixedBackgroundButton );

		expect( setAttributes ).toHaveBeenCalledWith(
			expect.objectContaining( {
				hasParallax: ! attributes.hasParallax,
			} )
		);
	} );

	it( 'edits the focal point with a slider', async () => {
		const screen = render(
			<CoverEdit
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
		);
		const editFocalPointButton =
			await screen.findByText( 'Edit focal point' );
		fireEvent.press( editFocalPointButton );
		fireEvent(
			screen.getByTestId( 'Slider Y-Axis Position', { hidden: true } ),
			'valueChange',
			'52'
		);
		fireEvent.press( screen.getByLabelText( 'Apply' ) );
		// TODO(jest-console): Fix the warning and remove the expect below.
		expect( console ).toHaveWarnedWith(
			`Non-serializable values were found in the navigation state. Check:\n\nFocalPoint > params.onFocalPointChange (Function)\n\nThis can break usage such as persisting and restoring state. This might happen if you passed non-serializable values such as function, class instances etc. in params. If you need to use components with callbacks in your options, you can use 'navigation.setOptions' instead. See https://reactnavigation.org/docs/troubleshooting#i-get-the-warning-non-serializable-values-were-found-in-the-navigation-state for more details.`
		);

		expect( setAttributes ).toHaveBeenCalledWith(
			expect.objectContaining( {
				focalPoint: { ...attributes.focalPoint, y: '0.52' },
			} )
		);
	} );

	it( 'edits the focal point with a text input', async () => {
		const screen = render(
			<CoverEdit
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
		);
		const editFocalPointButton =
			await screen.findByText( 'Edit focal point' );
		fireEvent.press( editFocalPointButton );
		fireEvent.press(
			screen.getByText( ( attributes.focalPoint.x * 100 ).toString(), {
				hidden: true,
			} )
		);
		fireEvent.changeText(
			screen.getByLabelText( 'X-Axis Position', { hidden: true } ),
			'99'
		);
		fireEvent.press( screen.getByLabelText( 'Apply' ) );

		expect( setAttributes ).toHaveBeenCalledWith(
			expect.objectContaining( {
				focalPoint: { ...attributes.focalPoint, x: '0.99' },
			} )
		);
	} );

	it( 'discards canceled focal point changes', async () => {
		const screen = render(
			<CoverEdit
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
		);
		const editFocalPointButton =
			await screen.findByText( 'Edit focal point' );
		fireEvent.press( editFocalPointButton );
		fireEvent.press(
			screen.getByText( ( attributes.focalPoint.x * 100 ).toString(), {
				hidden: true,
			} )
		);
		fireEvent.changeText(
			screen.getByLabelText( 'X-Axis Position', { hidden: true } ),
			'80'
		);
		fireEvent.press( screen.getByLabelText( 'Go back' ) );

		expect( setAttributes ).not.toHaveBeenCalledWith(
			expect.objectContaining( {
				focalPoint: { ...attributes.focalPoint, x: '0.80' },
			} )
		);
	} );

	it( 'clears the media within cell button', async () => {
		const screen = render(
			<CoverEdit
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
		);
		const clearMediaButton = await screen.findByText( 'Clear Media' );
		fireEvent.press( clearMediaButton );

		expect( setAttributes ).toHaveBeenCalledWith(
			expect.objectContaining( {
				focalPoint: undefined,
				hasParallax: undefined,
				id: undefined,
				url: undefined,
			} )
		);
	} );

	it( 'updates background opacity', async () => {
		const screen = await initializeEditor( {
			initialHtml: COVER_BLOCK_IMAGE_HTML,
		} );
		const { getByLabelText } = screen;

		// Get block
		const coverBlock = await getBlock( screen, 'Cover' );
		fireEvent.press( coverBlock );

		// Open block settings
		await openBlockSettings( screen );

		// Update Opacity attribute
		const opacityControl = getByLabelText( /Opacity/ );
		fireEvent.press(
			within( opacityControl ).getByText( '50', { hidden: true } )
		);
		const heightTextInput = within( opacityControl ).getByDisplayValue(
			'50',
			{ hidden: true }
		);
		fireEvent.changeText( heightTextInput, '20' );

		// The decreasing button should be disabled
		fireEvent( opacityControl, 'accessibilityAction', {
			nativeEvent: { actionName: 'decrement' },
		} );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );
} );

describe( 'color settings', () => {
	it( 'sets a color for the overlay background when the placeholder is visible', async () => {
		const screen = await initializeEditor( {
			initialHtml: COVER_BLOCK_PLACEHOLDER_HTML,
		} );

		const block = await screen.findByLabelText( 'Cover block. Empty' );
		expect( block ).toBeDefined();

		// Select a color from the placeholder palette.
		const colorPalette = await screen.findByTestId( 'color-palette' );
		const colorButton = within( colorPalette ).getByTestId( COLOR_PINK );

		expect( colorButton ).toBeDefined();
		fireEvent.press( colorButton );

		// Wait for the block to be created.
		const [ coverBlockWithOverlay ] =
			await screen.findAllByLabelText( /Cover Block\. Row 1/ );
		fireEvent.press( coverBlockWithOverlay );

		// Open Block Settings.
		const settingsButton = await screen.findByLabelText( 'Open Settings' );
		fireEvent.press( settingsButton );

		// Wait for Block Settings to be visible.
		const blockSettingsModal = screen.getByTestId( 'block-settings-modal' );
		await waitForModalVisible( blockSettingsModal );

		// Open the overlay color settings.
		const colorOverlay = await screen.findByLabelText( 'Color. Empty' );
		expect( colorOverlay ).toBeDefined();
		fireEvent.press( colorOverlay );

		// Find the selected color.
		const colorPaletteButton = await screen.findByTestId( COLOR_PINK );
		expect( colorPaletteButton ).toBeDefined();
		// TODO(jest-console): Fix the warning and remove the expect below.
		expect( console ).toHaveWarnedWith(
			`Non-serializable values were found in the navigation state. Check:\n\nColor > params.onColorChange (Function)\n\nThis can break usage such as persisting and restoring state. This might happen if you passed non-serializable values such as function, class instances etc. in params. If you need to use components with callbacks in your options, you can use 'navigation.setOptions' instead. See https://reactnavigation.org/docs/troubleshooting#i-get-the-warning-non-serializable-values-were-found-in-the-navigation-state for more details.`
		);

		// Select another color.
		const newColorButton = await screen.findByTestId( COLOR_RED );
		fireEvent.press( newColorButton );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'sets a gradient overlay background when a solid background was already selected', async () => {
		const screen = await initializeEditor( {
			initialHtml: COVER_BLOCK_SOLID_COLOR_HTML,
		} );

		// Wait for the block to be created.
		const [ coverBlock ] =
			await screen.findAllByLabelText( /Cover Block\. Row 1/ );
		fireEvent.press( coverBlock );

		// Open Block Settings.
		const settingsButton = await screen.findByLabelText( 'Open Settings' );
		fireEvent.press( settingsButton );

		// Wait for Block Settings to be visible.
		const blockSettingsModal = screen.getByTestId( 'block-settings-modal' );
		await waitForModalVisible( blockSettingsModal );

		// Open the overlay color settings.
		const colorOverlay = await screen.findByLabelText( 'Color. Empty' );
		fireEvent.press( colorOverlay );

		// Find the selected color.
		const colorButton = await screen.findByTestId( COLOR_GRAY );
		expect( colorButton ).toBeDefined();

		// Open the gradients.
		const gradientsButton = await screen.findByLabelText( 'Gradient' );
		expect( gradientsButton ).toBeDefined();

		fireEvent( gradientsButton, 'layout', {
			nativeEvent: { layout: { width: 80, height: 26 } },
		} );
		fireEvent.press( gradientsButton );

		// Find the gradient color.
		const newGradientButton = await screen.findByTestId( GRADIENT_GREEN );
		fireEvent.press( newGradientButton );

		// Dismiss the Block Settings modal.
		fireEvent( blockSettingsModal, 'backdropPress' );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'toggles between solid colors and gradients', async () => {
		const screen = await initializeEditor( {
			initialHtml: COVER_BLOCK_PLACEHOLDER_HTML,
		} );

		const block = await screen.findByLabelText( 'Cover block. Empty' );
		expect( block ).toBeDefined();

		// Select a color from the placeholder palette.
		const colorPalette = await screen.findByTestId( 'color-palette' );
		const colorButton = within( colorPalette ).getByTestId( COLOR_PINK );

		expect( colorButton ).toBeDefined();
		fireEvent.press( colorButton );

		// Wait for the block to be created.
		const [ coverBlockWithOverlay ] =
			await screen.findAllByLabelText( /Cover Block\. Row 1/ );
		fireEvent.press( coverBlockWithOverlay );

		// Open Block Settings.
		const settingsButton = await screen.findByLabelText( 'Open Settings' );
		fireEvent.press( settingsButton );

		// Wait for Block Settings to be visible.
		const blockSettingsModal = screen.getByTestId( 'block-settings-modal' );
		await waitForModalVisible( blockSettingsModal );

		// Open the overlay color settings.
		const colorOverlay = await screen.findByLabelText( 'Color. Empty' );
		fireEvent.press( colorOverlay );

		// Find the selected color.
		const colorPaletteButton = await screen.findByTestId( COLOR_PINK );
		expect( colorPaletteButton ).toBeDefined();

		// Select another color.
		const newColorButton = await screen.findByTestId( COLOR_RED );
		fireEvent.press( newColorButton );

		// Open the gradients.
		const gradientsButton = await screen.findByLabelText( 'Gradient' );

		fireEvent( gradientsButton, 'layout', {
			nativeEvent: { layout: { width: 80, height: 26 } },
		} );
		fireEvent.press( gradientsButton );

		// Find the gradient color.
		const newGradientButton = await screen.findByTestId( GRADIENT_GREEN );
		fireEvent.press( newGradientButton );

		// Go back to the settings list.
		fireEvent.press( await screen.findByLabelText( 'Go back' ) );

		// Find the color setting.
		const colorSetting = await screen.findByLabelText( 'Color. Empty' );
		fireEvent.press( colorSetting );

		// Dismiss the Block Settings modal.
		fireEvent( blockSettingsModal, 'backdropPress' );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'clears the selected overlay color and mantains the inner blocks', async () => {
		const screen = await initializeEditor( {
			initialHtml: COVER_BLOCK_SOLID_COLOR_HTML,
		} );

		// Wait for the block to be created.
		const [ coverBlock ] =
			await screen.findAllByLabelText( /Cover Block\. Row 1/ );
		fireEvent.press( coverBlock );

		// Open Block Settings.
		const settingsButton = await screen.findByLabelText( 'Open Settings' );
		fireEvent.press( settingsButton );

		// Wait for Block Settings to be visible.
		const blockSettingsModal = screen.getByTestId( 'block-settings-modal' );
		await waitForModalVisible( blockSettingsModal );

		// Open the overlay color settings.
		const colorOverlay = await screen.findByLabelText( 'Color. Empty' );
		fireEvent.press( colorOverlay );

		// Find the selected color.
		const colorButton = await screen.findByTestId( COLOR_GRAY );
		expect( colorButton ).toBeDefined();

		// Reset the selected color.
		const resetButton = await screen.findByText( 'Reset' );
		fireEvent.press( resetButton );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'displays the hex color value in the custom color picker', async () => {
		const screen = await initializeEditor( {
			initialHtml: COVER_BLOCK_PLACEHOLDER_HTML,
		} );

		// Select a color from the placeholder palette.
		const colorButton = screen.getByA11yHint(
			'Navigates to custom color picker'
		);
		fireEvent.press( colorButton );

		// Wait for Block Settings to be visible.
		const blockSettingsModal = screen.getByTestId( 'block-settings-modal' );
		await waitForModalVisible( blockSettingsModal );

		// Assert label text before tapping color picker
		expect( screen.getByText( 'Select a color' ) ).toBeVisible();

		// Tap color picker
		const colorPicker = screen.getByTestId( 'hsv-color-picker' );
		fireEvent( colorPicker, 'onHuePickerPress', {
			hue: 120,
			saturation: 12,
			value: 50,
		} );

		// Assert label hex value after tapping color picker
		expect( screen.getByText( '#00FF00' ) ).toBeVisible();
	} );
} );

describe( 'minimum height settings', () => {
	it( 'changes the height value to 20(vw)', async () => {
		const screen = await initializeEditor( {
			initialHtml: COVER_BLOCK_IMAGE_HTML,
		} );
		const { getByText, getByDisplayValue } = screen;

		// Get block
		const coverBlock = await getBlock( screen, 'Cover' );
		fireEvent.press( coverBlock );

		// Open block settings
		await openBlockSettings( screen );

		// Set vw unit
		fireEvent.press( getByText( 'px', { hidden: true } ) );
		fireEvent.press( getByText( 'Viewport width (vw)', { hidden: true } ) );

		// Update height attribute
		fireEvent.press( getByText( '300', { hidden: true } ) );
		const heightTextInput = getByDisplayValue( '300', { hidden: true } );
		fireEvent.changeText( heightTextInput, '20' );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'changes the height value between units', async () => {
		const screen = await initializeEditor( {
			initialHtml: COVER_BLOCK_CUSTOM_HEIGHT_HTML,
		} );
		const { getByText } = screen;

		// Get block
		const coverBlock = await getBlock( screen, 'Cover' );
		fireEvent.press( coverBlock );

		// Open block settings
		await openBlockSettings( screen );

		// Set the pixel unit
		fireEvent.press( getByText( 'vw', { hidden: true } ) );
		fireEvent.press( getByText( 'Pixels (px)', { hidden: true } ) );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	describe( 'disables the decrease button when reaching the minimum value', () => {
		const testData = [
			[ 'Pixels (px)', '50', '50' ],
			[ 'Relative to parent font size (em)', '20', '1' ],
			[ 'Relative to root font size (rem)', '20', '1' ],
			[ 'Viewport width (vw)', '20', '1' ],
			[ 'Viewport height (vh)', '20', '1' ],
		];

		test.each( testData )(
			'for %s',
			async ( unitName, value, minValue ) => {
				const screen = await initializeEditor( {
					initialHtml: COVER_BLOCK_CUSTOM_HEIGHT_HTML,
				} );
				const { getByLabelText, getByText } = screen;

				// Get block
				const coverBlock = await getBlock( screen, 'Cover' );
				fireEvent.press( coverBlock );

				// Open block settings
				await openBlockSettings( screen );

				// Set the unit name
				fireEvent.press( getByText( 'vw', { hidden: true } ) );
				fireEvent.press( getByText( unitName, { hidden: true } ) );

				// Update height attribute
				const heightControl = getByLabelText( /Minimum height/ );
				fireEvent.press(
					within( heightControl ).getByText( value, { hidden: true } )
				);
				const heightTextInput = within(
					heightControl
				).getByDisplayValue( value, { hidden: true } );
				fireEvent.changeText( heightTextInput, minValue );

				// The decreasing button should be disabled
				fireEvent( heightControl, 'accessibilityAction', {
					nativeEvent: { actionName: 'decrement' },
				} );

				expect( getEditorHtml() ).toMatchSnapshot();
			}
		);
	} );
} );
