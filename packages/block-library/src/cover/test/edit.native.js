/**
 * External dependencies
 */
import { AccessibilityInfo, Image } from 'react-native';
import { act, render, fireEvent } from '@testing-library/react-native';

/**
 * WordPress dependencies
 */
import { BottomSheetSettings, BlockEdit } from '@wordpress/block-editor';
import { SlotFillProvider } from '@wordpress/components';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import { requestMediaPicker } from '@wordpress/react-native-bridge';

/**
 * Internal dependencies
 */
import { IMAGE_BACKGROUND_TYPE } from '../shared';
import { metadata, settings, name } from '../index';

// Avoid errors due to mocked stylesheet files missing required selectors
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

// Simplified tree to render Cover edit within slot
const CoverEdit = ( props ) => (
	<SlotFillProvider>
		<BlockEdit isSelected name={ name } clientId={ 0 } { ...props } />
		<BottomSheetSettings isVisible />
	</SlotFillProvider>
);

const setAttributes = jest.fn();
const attributes = {
	backgroundType: IMAGE_BACKGROUND_TYPE,
	focalPoint: { x: '0.25', y: '0.75' },
	hasParallax: false,
	onFocalPointChange: jest.fn(),
	overlayColor: { color: '#000000' },
	url: 'mock-url',
};

let imageSize;
beforeAll( () => {
	// Mock Image.getSize to avoid failed attempt to size non-existant image
	const getSizemock = jest.spyOn( Image, 'getSize' );
	imageSize = Promise.resolve( 300, 200 );
	getSizemock.mockReturnValue( imageSize );

	// Register required blocks
	registerBlockType( name, {
		...metadata,
		...settings,
	} );
	registerBlockType( 'core/paragraph', {
		category: 'text',
		title: 'Paragraph',
		edit: () => {},
		save: () => {},
		transforms: {
			to: [
				{
					type: 'block',
					blocks: [ 'core/heading' ],
					transform: () => {},
				},
			],
		},
	} );
} );

afterAll( () => {
	// Restore mocks
	Image.getSize.mockRestore();

	// Clean up registered blocks
	unregisterBlockType( name );
	unregisterBlockType( 'core/paragraph' );
} );

describe( 'when no media is attached', () => {
	it( 'allows adding an image or video', async () => {
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

describe( 'when media is attached', () => {
	it( 'allows editing the focal point with text input', async () => {
		// Mock async native module to avoid act warning
		const isScreenReaderEnabled = Promise.resolve( true );
		AccessibilityInfo.isScreenReaderEnabled = jest.fn(
			() => isScreenReaderEnabled
		);

		const { getByText, findByText, findByLabelText } = render(
			<CoverEdit
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
		);
		// Await async update to component state to avoid act warning
		await act( () => isScreenReaderEnabled );
		fireEvent.press( getByText( 'Edit focal point' ) );
		const xAxisCell = await findByText(
			( attributes.focalPoint.x * 100 ).toString()
		);
		fireEvent.press( xAxisCell );
		const xAxisInput = await findByLabelText( 'X-Axis Position' );
		fireEvent.changeText( xAxisInput, '99' );
		const applyButton = await findByLabelText( 'Apply' );
		fireEvent.press( applyButton );

		expect( setAttributes ).toHaveBeenCalledWith(
			expect.objectContaining( {
				focalPoint: { ...attributes.focalPoint, x: '0.99' },
			} )
		);
	} );
} );
