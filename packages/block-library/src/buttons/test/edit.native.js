/**
 * External dependencies
 */
// import { Image } from 'react-native';
import {
	fireEvent,
	waitFor,
	getEditorHtml,
	within,
	initializeEditor,
} from 'test/helpers';

/**
 * WordPress dependencies
 */
// import { BottomSheetSettings, BlockEdit } from '@wordpress/block-editor';
// import { SlotFillProvider } from '@wordpress/components';
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';

/**
 * Internal dependencies
 */
// import { IMAGE_BACKGROUND_TYPE } from '../../cover/shared';
// import { name, metadata, settings } from '../index';

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

describe( 'Test case', () => {
	it( 'Test if block is rendered', async () => {
		const initialHtml = `<!-- wp:buttons -->
		<div class="wp-block-buttons"><!-- wp:button -->
		<div class="wp-block-button"><a class="wp-block-button__link">Hello</a></div>
		<!-- /wp:button --></div>
		<!-- /wp:buttons -->`;
		const { getByA11yLabel, getByText } = await initializeEditor( {
			initialHtml,
		} );

		// Tap the Buttons block
		const buttonsBlock = await waitFor( () =>
			getByA11yLabel( /Buttons Block\. Row 1/ )
		);
		fireEvent.press( buttonsBlock );

		// onLayout event has to be explicitly dispatched in BlockList component,
		// otherwise the inner blocks are not rendered.
		const innerBlockListWrapper = await waitFor( () =>
			within( buttonsBlock ).getByTestId( 'block-list-wrapper' )
		);
		fireEvent( innerBlockListWrapper, 'layout', {
			nativeEvent: {
				layout: {
					width: 100,
				},
			},
		} );

		// Tap the Button block
		const buttonInnerBlock = await waitFor( () =>
			within( buttonsBlock ).getByA11yLabel( /Button Block\. Row 1/ )
		);
		fireEvent.press( buttonInnerBlock );

		// Open the Button block settings
		const settingsButton = await waitFor( () =>
			getByA11yLabel( 'Open Settings' )
		);
		fireEvent.press( settingsButton );

		const radiusSlider = await waitFor( () =>
			getByText( 'Border Radius' )
		);
		// Adjust the Button block border radius slider
		fireEvent( radiusSlider, 'valueChange', '31' );

		expect( getEditorHtml() ).toBe( initialHtml );
	} );
} );

// // Avoid errors due to mocked stylesheet files missing required selectors
// jest.mock( '@wordpress/compose', () => ( {
// 	...jest.requireActual( '@wordpress/compose' ),
// 	withPreferredColorScheme: jest.fn( ( Component ) => ( props ) => (
// 		<Component
// 			{ ...props }
// 			preferredColorScheme={ {} }
// 			getStylesFromColorScheme={ jest.fn( () => ( {} ) ) }
// 		/>
// 	) ),
// } ) );

// const ButtonsEdit = ( props ) => (
// 	<SlotFillProvider>
// 		<BlockEdit isSelected name={ name } clientId={ 0 } { ...props } />
// 		<BottomSheetSettings isVisible />
// 	</SlotFillProvider>
// );

// const setAttributes = jest.fn();
// const attributes = {
// 	marginLeft: 10,
// 	// backgroundType: IMAGE_BACKGROUND_TYPE,
// 	// focalPoint: { x: '0.25', y: '0.75' },
// 	// hasParallax: false,
// 	// overlayColor: { color: '#000000' },
// 	// url: 'mock-url',
// };
//
// beforeAll( () => {
// 	// // Mock Image.getSize to avoid failed attempt to size non-existant image
// 	// const getSizeSpy = jest.spyOn( Image, 'getSize' );
// 	// getSizeSpy.mockImplementation( ( _url, callback ) => callback( 300, 200 ) );

// 	// Register required blocks
// 	registerBlockType( name, {
// 		...metadata,
// 		...settings,
// 	} );
// 	registerBlockType( 'core/paragraph', {
// 		category: 'text',
// 		title: 'Paragraph',
// 		edit: () => {},
// 		save: () => {},
// 	} );

// 	registerBlockType( 'core/button', {
// 		category: 'text',
// 		title: 'Button',
// 		edit: () => {},
// 		save: () => {},
// 	} );
// } );

// afterAll( () => {
// 	// // Restore mocks
// 	// Image.getSize.mockRestore();

// 	unregisterBlockType( name );
// 	unregisterBlockType( 'core/paragraph' );
// 	unregisterBlockType( 'core/button' );
// } );

// describe( 'when corner radius is changed', () => {
// 	it( 'corner radius is changed', async () => {
// 		const { debug, getByLabelText } = render(
// 			<ButtonsEdit
// 				attributes={ {
// 					...attributes,
// 					url: undefined,
// 					backgroundType: undefined,
// 				} }
// 				setAttributes={ setAttributes }
// 			/>
// 		);
// 		debug();
// 		console.log( getEditorHtml() );
// 		fireEvent( getByLabelText( 'Border Radius' ), 'valueChange', '31' );
// 		console.log( getEditorHtml() );
// 		// expect( getEditorHtml() ).toBe( '<!-- wp:block {"ref":1} /-->' );
// 	} );
// } );
