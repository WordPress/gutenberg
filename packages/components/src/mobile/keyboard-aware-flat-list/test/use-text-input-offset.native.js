/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react-native';

/**
 * WordPress dependencies
 */
import RCTAztecView from '@wordpress/react-native-aztec';

/**
 * Internal dependencies
 */
import useTextInputOffset from '../use-text-input-offset';

jest.mock( '@wordpress/react-native-aztec', () => ( {
	InputState: {
		getCurrentFocusedElement: jest.fn(),
	},
} ) );

describe( 'useTextInputOffset', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should return a function', () => {
		// Arrange
		const scrollViewRef = { current: {} };
		const scrollEnabled = true;

		// Act
		const { result } = renderHook( () =>
			useTextInputOffset( scrollEnabled, scrollViewRef )
		);

		// Assert
		expect( result.current[ 0 ] ).toBeInstanceOf( Function );
	} );

	it( 'should return null when scrollViewRef.current is null', async () => {
		// Arrange
		const scrollViewRef = { current: null };
		const scrollEnabled = true;

		// Act
		const { result } = renderHook( () =>
			useTextInputOffset( scrollEnabled, scrollViewRef )
		);
		const getTextInputOffset = result.current[ 0 ];

		// Assert
		const offset = await getTextInputOffset();
		expect( offset ).toBeNull();
	} );

	it( 'should return null when textInput is null', async () => {
		// Arrange
		const scrollViewRef = { current: {} };
		const scrollEnabled = true;
		RCTAztecView.InputState.getCurrentFocusedElement.mockReturnValue(
			null
		);

		// Act
		const { result } = renderHook( () =>
			useTextInputOffset( scrollEnabled, scrollViewRef )
		);
		const getTextInputOffset = result.current[ 0 ];

		// Assert
		const offset = await getTextInputOffset();
		expect( offset ).toBeNull();
	} );

	it( 'should return null when scroll is not enabled', async () => {
		// Arrange
		const scrollViewRef = { current: {} };
		const scrollEnabled = false;

		// Act
		const { result } = renderHook( () =>
			useTextInputOffset( scrollEnabled, scrollViewRef )
		);
		const getTextInputOffset = result.current[ 0 ];

		// Assert
		const offset = await getTextInputOffset();
		expect( offset ).toBeNull();
	} );

	it( 'should return correct offset value when caretY is not null', async () => {
		// Arrange
		const scrollViewRef = { current: {} };
		const scrollEnabled = true;
		const x = 0;
		const y = 10;
		const width = 0;
		const height = 100;
		const textInput = {
			measureLayout: jest.fn( ( _, callback ) => {
				callback( x, y, width, height );
			} ),
		};
		RCTAztecView.InputState.getCurrentFocusedElement.mockReturnValue(
			textInput
		);

		// Act
		const { result } = renderHook( () =>
			useTextInputOffset( scrollEnabled, scrollViewRef )
		);
		const getTextInputOffset = result.current[ 0 ];

		// Assert
		const offset = await getTextInputOffset( { caretY: 10 } );
		expect( offset ).toBe( 20 );
	} );

	it( 'should return correct offset value when caretY is -1', async () => {
		// Arrange
		const scrollViewRef = { current: {} };
		const scrollEnabled = true;
		const x = 0;
		const y = 10;
		const width = 0;
		const height = 100;
		const textInput = {
			measureLayout: jest.fn( ( _, callback ) => {
				callback( x, y, width, height );
			} ),
		};
		RCTAztecView.InputState.getCurrentFocusedElement.mockReturnValue(
			textInput
		);

		// Act
		const { result } = renderHook( () =>
			useTextInputOffset( scrollEnabled, scrollViewRef )
		);
		const getTextInputOffset = result.current[ 0 ];

		// Assert
		const offset = await getTextInputOffset( { caretY: -1 } );
		expect( offset ).toBe( 110 );
	} );
} );
