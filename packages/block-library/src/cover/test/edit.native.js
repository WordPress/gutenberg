/**
 * External dependencies
 */
import { Image } from 'react-native';
import { render as rtlRender } from '@testing-library/react-native';
import { act } from 'react-test-renderer';

/**
 * WordPress dependencies
 */
import { BottomSheetSettings, BlockEdit } from '@wordpress/block-editor';
import { SlotFillProvider } from '@wordpress/components';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { IMAGE_BACKGROUND_TYPE } from '../shared';
import { metadata, settings, name } from '../index';

function render( props ) {
	return rtlRender(
		<SlotFillProvider>
			<BlockEdit isSelected name={ name } clientId={ 0 } { ...props } />
			<BottomSheetSettings isVisible />
		</SlotFillProvider>
	);
}

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

// Mock Image.getSize to avoid unhandled async callback
const getSizemock = jest.spyOn( Image, 'getSize' );
const imageSize = Promise.resolve();
getSizemock.mockReturnValue( imageSize );

const setAttributes = jest.fn();
const MOCK_URL = 'mock-url';
const MOCK_FOCAL_POINT = { x: '0.5', y: '0.5' };

const attributes = {
	backgroundType: IMAGE_BACKGROUND_TYPE,
	hasParallax: false,
	focalPoint: MOCK_FOCAL_POINT,
	onFocalPointChange: jest.fn(),
	url: MOCK_URL,
};

beforeAll( () => {
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
	unregisterBlockType( name );
	unregisterBlockType( 'core/paragraph' );
	Image.getSize.mockRestore();
} );

describe( 'Cover block edit', () => {
	it( 'displays an edit focal point button', async () => {
		const { getByText } = render( {
			attributes,
			setAttributes,
		} );

		expect( getByText( 'Edit focal point' ) ).toBeTruthy();
		await act( () => imageSize );
	} );
} );
