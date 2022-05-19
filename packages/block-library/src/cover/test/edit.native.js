/**
 * External dependencies
 */
import { AccessibilityInfo, Image } from 'react-native';
import {
	getEditorHtml,
	initializeEditor,
	render,
	fireEvent,
	waitFor,
	within,
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
import { registerBlock } from '../..';

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

const COVER_BLOCK_PLACEHOLDER_HTML = `<!-- wp:cover -->
<div class="wp-block-cover"><span aria-hidden="true" class="has-background-dim-100 wp-block-cover__gradient-background has-background-dim"></span><div class="wp-block-cover__inner-container"></div></div>
<!-- /wp:cover -->`;
const COVER_BLOCK_SOLID_COLOR_HTML = `<!-- wp:cover {"overlayColor":"cyan-bluish-gray"} -->
<div class="wp-block-cover"><span aria-hidden="true" class="has-cyan-bluish-gray-background-color has-background-dim-100 wp-block-cover__gradient-background has-background-dim"></span><div class="wp-block-cover__inner-container"><!-- wp:paragraph {"align":"center","placeholder":"Write title…"} -->
<p class="has-text-align-center"></p>
<!-- /wp:paragraph --></div></div>
<!-- /wp:cover -->`;

const COLOR_PINK = '#f78da7';
const COLOR_RED = '#cf2e2e';
const COLOR_GRAY = '#abb8c3';
const GRADIENT_GREEN =
	'linear-gradient(135deg,rgb(122,220,180) 0%,rgb(0,208,130) 100%)';

// Simplified tree to render Cover edit within slot.
const CoverEdit = ( props ) => (
	<SlotFillProvider>
		<BlockEdit isSelected name={ cover.name } clientId={ 0 } { ...props } />
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

	AccessibilityInfo.isScreenReaderEnabled.mockResolvedValue(
		Promise.resolve( true )
	);

	// Register required blocks.
	registerBlock( paragraph );
	registerBlock( cover );
	setDefaultBlockName( paragraph.name );
} );

afterAll( () => {
	// Restore mocks.
	Image.getSize.mockRestore();
	AccessibilityInfo.isScreenReaderEnabled.mockReset();

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

describe( 'when an image is attached', () => {
	it( 'edits the image', async () => {
		const { getByLabelText, getByText } = render(
			<CoverEdit
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
		);

		fireEvent.press( getByLabelText( 'Edit image' ) );
		const editButton = await waitFor( () => getByText( 'Edit' ) );
		fireEvent.press( editButton );

		expect( requestMediaEditor ).toHaveBeenCalled();
	} );

	it( 'replaces the image', async () => {
		const { getByLabelText, getByText } = render(
			<CoverEdit
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
		);
		fireEvent.press( getByLabelText( 'Edit image' ) );
		const replaceButton = await waitFor( () => getByText( 'Replace' ) );
		fireEvent.press( replaceButton );
		const mediaLibraryButton = await waitFor( () =>
			getByText( 'WordPress Media Library' )
		);
		fireEvent.press( mediaLibraryButton );

		expect( requestMediaPicker ).toHaveBeenCalled();
	} );

	it( 'clears the image within image edit button', async () => {
		const { getByLabelText, getAllByText } = render(
			<CoverEdit
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
		);
		fireEvent.press( getByLabelText( 'Edit image' ) );
		const clearMediaButton = await waitFor( () =>
			getAllByText( 'Clear Media' )
		);
		fireEvent.press( clearMediaButton[ 0 ] );

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
		const { getByText } = render(
			<CoverEdit
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
		);
		const fixedBackgroundButton = await waitFor( () =>
			getByText( 'Fixed background' )
		);
		fireEvent.press( fixedBackgroundButton );

		expect( setAttributes ).toHaveBeenCalledWith(
			expect.objectContaining( {
				hasParallax: ! attributes.hasParallax,
			} )
		);
	} );

	it( 'edits the focal point with a slider', async () => {
		const { getByText, getByLabelText, getByTestId } = render(
			<CoverEdit
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
		);
		const editFocalPointButton = await waitFor( () =>
			getByText( 'Edit focal point' )
		);
		fireEvent.press( editFocalPointButton );
		fireEvent(
			getByTestId( 'Slider Y-Axis Position' ),
			'valueChange',
			'52'
		);
		fireEvent.press( getByLabelText( 'Apply' ) );

		expect( setAttributes ).toHaveBeenCalledWith(
			expect.objectContaining( {
				focalPoint: { ...attributes.focalPoint, y: '0.52' },
			} )
		);
	} );

	it( 'edits the focal point with a text input', async () => {
		const { getByText, getByLabelText } = render(
			<CoverEdit
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
		);
		const editFocalPointButton = await waitFor( () =>
			getByText( 'Edit focal point' )
		);
		fireEvent.press( editFocalPointButton );
		fireEvent.press(
			getByText( ( attributes.focalPoint.x * 100 ).toString() )
		);
		fireEvent.changeText( getByLabelText( 'X-Axis Position' ), '99' );
		fireEvent.press( getByLabelText( 'Apply' ) );

		expect( setAttributes ).toHaveBeenCalledWith(
			expect.objectContaining( {
				focalPoint: { ...attributes.focalPoint, x: '0.99' },
			} )
		);
	} );

	it( 'discards canceled focal point changes', async () => {
		const { getByText, getByLabelText } = render(
			<CoverEdit
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
		);
		const editFocalPointButton = await waitFor( () =>
			getByText( 'Edit focal point' )
		);
		fireEvent.press( editFocalPointButton );
		fireEvent.press(
			getByText( ( attributes.focalPoint.x * 100 ).toString() )
		);
		fireEvent.changeText( getByLabelText( 'X-Axis Position' ), '80' );
		fireEvent.press( getByLabelText( 'Go back' ) );

		expect( setAttributes ).not.toHaveBeenCalledWith(
			expect.objectContaining( {
				focalPoint: { ...attributes.focalPoint, x: '0.80' },
			} )
		);
	} );

	it( 'clears the media within cell button', async () => {
		const { getByText } = render(
			<CoverEdit
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
		);
		const clearMediaButton = await waitFor( () =>
			getByText( 'Clear Media' )
		);
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
} );

describe( 'color settings', () => {
	it( 'sets a color for the overlay background when the placeholder is visible', async () => {
		const { getByTestId, getByA11yLabel } = await initializeEditor( {
			initialHtml: COVER_BLOCK_PLACEHOLDER_HTML,
		} );

		const block = await waitFor( () =>
			getByA11yLabel( 'Cover block. Empty' )
		);
		expect( block ).toBeDefined();

		// Select a color from the placeholder palette.
		const colorPalette = await waitFor( () =>
			getByTestId( 'color-palette' )
		);
		const colorButton = within( colorPalette ).getByTestId( COLOR_PINK );

		expect( colorButton ).toBeDefined();
		fireEvent.press( colorButton );

		// Wait for the block to be created.
		const coverBlockWithOverlay = await waitFor( () =>
			getByA11yLabel( /Cover Block\. Row 1/ )
		);
		fireEvent.press( coverBlockWithOverlay );

		// Open Block Settings.
		const settingsButton = await waitFor( () =>
			getByA11yLabel( 'Open Settings' )
		);
		fireEvent.press( settingsButton );

		// Wait for Block Settings to be visible.
		const blockSettingsModal = getByTestId( 'block-settings-modal' );
		await waitFor( () => blockSettingsModal.props.isVisible );

		// Open the overlay color settings.
		const colorOverlay = await waitFor( () =>
			getByA11yLabel( 'Color. Empty' )
		);
		expect( colorOverlay ).toBeDefined();
		fireEvent.press( colorOverlay );

		// Find the selected color.
		const colorPaletteButton = await waitFor( () =>
			getByTestId( COLOR_PINK )
		);
		expect( colorPaletteButton ).toBeDefined();

		// Select another color.
		const newColorButton = await waitFor( () => getByTestId( COLOR_RED ) );
		fireEvent.press( newColorButton );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'sets a gradient overlay background when a solid background was already selected', async () => {
		const { getByTestId, getByA11yLabel } = await initializeEditor( {
			initialHtml: COVER_BLOCK_SOLID_COLOR_HTML,
		} );

		// Wait for the block to be created.
		const coverBlock = await waitFor( () =>
			getByA11yLabel( /Cover Block\. Row 1/ )
		);
		expect( coverBlock ).toBeDefined();
		fireEvent.press( coverBlock );

		// Open Block Settings.
		const settingsButton = await waitFor( () =>
			getByA11yLabel( 'Open Settings' )
		);
		fireEvent.press( settingsButton );

		// Wait for Block Settings to be visible.
		const blockSettingsModal = getByTestId( 'block-settings-modal' );
		await waitFor( () => blockSettingsModal.props.isVisible );

		// Open the overlay color settings.
		const colorOverlay = await waitFor( () =>
			getByA11yLabel( 'Color. Empty' )
		);
		expect( colorOverlay ).toBeDefined();
		fireEvent.press( colorOverlay );

		// Find the selected color.
		const colorButton = await waitFor( () => getByTestId( COLOR_GRAY ) );
		expect( colorButton ).toBeDefined();

		// Open the gradients.
		const gradientsButton = await waitFor( () =>
			getByA11yLabel( 'Gradient' )
		);
		expect( gradientsButton ).toBeDefined();

		fireEvent( gradientsButton, 'layout', {
			nativeEvent: { layout: { width: 80, height: 26 } },
		} );
		fireEvent.press( gradientsButton );

		// Find the gradient color.
		const newGradientButton = await waitFor( () =>
			getByTestId( GRADIENT_GREEN )
		);
		expect( newGradientButton ).toBeDefined();
		fireEvent.press( newGradientButton );

		// Dismiss the Block Settings modal.
		fireEvent( blockSettingsModal, 'backdropPress' );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'toggles between solid colors and gradients', async () => {
		const { getByTestId, getByA11yLabel } = await initializeEditor( {
			initialHtml: COVER_BLOCK_PLACEHOLDER_HTML,
		} );

		const block = await waitFor( () =>
			getByA11yLabel( 'Cover block. Empty' )
		);
		expect( block ).toBeDefined();

		// Select a color from the placeholder palette.
		const colorPalette = await waitFor( () =>
			getByTestId( 'color-palette' )
		);
		const colorButton = within( colorPalette ).getByTestId( COLOR_PINK );

		expect( colorButton ).toBeDefined();
		fireEvent.press( colorButton );

		// Wait for the block to be created.
		const coverBlockWithOverlay = await waitFor( () =>
			getByA11yLabel( /Cover Block\. Row 1/ )
		);
		fireEvent.press( coverBlockWithOverlay );

		// Open Block Settings.
		const settingsButton = await waitFor( () =>
			getByA11yLabel( 'Open Settings' )
		);
		fireEvent.press( settingsButton );

		// Wait for Block Settings to be visible.
		const blockSettingsModal = getByTestId( 'block-settings-modal' );
		await waitFor( () => blockSettingsModal.props.isVisible );

		// Open the overlay color settings.
		const colorOverlay = await waitFor( () =>
			getByA11yLabel( 'Color. Empty' )
		);
		expect( colorOverlay ).toBeDefined();
		fireEvent.press( colorOverlay );

		// Find the selected color.
		const colorPaletteButton = await waitFor( () =>
			getByTestId( COLOR_PINK )
		);
		expect( colorPaletteButton ).toBeDefined();

		// Select another color.
		const newColorButton = await waitFor( () => getByTestId( COLOR_RED ) );
		fireEvent.press( newColorButton );

		// Open the gradients.
		const gradientsButton = await waitFor( () =>
			getByA11yLabel( 'Gradient' )
		);
		expect( gradientsButton ).toBeDefined();

		fireEvent( gradientsButton, 'layout', {
			nativeEvent: { layout: { width: 80, height: 26 } },
		} );
		fireEvent.press( gradientsButton );

		// Find the gradient color.
		const newGradientButton = await waitFor( () =>
			getByTestId( GRADIENT_GREEN )
		);
		expect( newGradientButton ).toBeDefined();
		fireEvent.press( newGradientButton );

		// Go back to the settings list.
		fireEvent.press( await waitFor( () => getByA11yLabel( 'Go back' ) ) );

		// Find the color setting.
		const colorSetting = await waitFor( () =>
			getByA11yLabel( 'Color. Empty' )
		);
		expect( colorSetting ).toBeDefined();
		fireEvent.press( colorSetting );

		// Dismiss the Block Settings modal.
		fireEvent( blockSettingsModal, 'backdropPress' );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'clears the selected overlay color and mantains the inner blocks', async () => {
		const {
			getByTestId,
			getByA11yLabel,
			getByText,
		} = await initializeEditor( {
			initialHtml: COVER_BLOCK_SOLID_COLOR_HTML,
		} );

		// Wait for the block to be created.
		const coverBlock = await waitFor( () =>
			getByA11yLabel( /Cover Block\. Row 1/ )
		);
		expect( coverBlock ).toBeDefined();
		fireEvent.press( coverBlock );

		// Open Block Settings.
		const settingsButton = await waitFor( () =>
			getByA11yLabel( 'Open Settings' )
		);
		fireEvent.press( settingsButton );

		// Wait for Block Settings to be visible.
		const blockSettingsModal = getByTestId( 'block-settings-modal' );
		await waitFor( () => blockSettingsModal.props.isVisible );

		// Open the overlay color settings.
		const colorOverlay = await waitFor( () =>
			getByA11yLabel( 'Color. Empty' )
		);
		expect( colorOverlay ).toBeDefined();
		fireEvent.press( colorOverlay );

		// Find the selected color.
		const colorButton = await waitFor( () => getByTestId( COLOR_GRAY ) );
		expect( colorButton ).toBeDefined();

		// Reset the selected color.
		const resetButton = await waitFor( () => getByText( 'Reset' ) );
		expect( resetButton ).toBeDefined();
		fireEvent.press( resetButton );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );
} );
