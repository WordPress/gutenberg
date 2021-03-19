/**
 * External dependencies
 */
import { Image } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { act } from 'react-test-renderer';

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
	focalPoint: { x: '0.5', y: '0.5' },
	hasParallax: false,
	onFocalPointChange: jest.fn(),
	overlayColor: { color: '#000000' },
	url: 'mock-url',
};

let imageSize;
beforeAll( () => {
	// Mock Image.getSize to avoid act warning for unhandled async callback
	const getSizemock = jest.spyOn( Image, 'getSize' );
	imageSize = Promise.resolve();
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
		const { getByText, findByText, debug } = render(
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

		await act( () => imageSize );
	} );
} );

describe( 'when media is attached', () => {
	it( 'allow editing the focal point', async () => {
		const { getByText } = render(
			<CoverEdit
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
		);
		fireEvent.press( getByText( 'Edit focal point' ) );

		await waitFor( () =>
			expect( getByText( 'X-Axis Position' ) ).toBeTruthy()
		);

		await act( () => imageSize );
	} );
} );
