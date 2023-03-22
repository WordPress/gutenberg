/**
 * External dependencies
 */

import { renderHook } from '@testing-library/react-native';

/**
 * Internal dependencies
 */
import useScrollToTextInput from '../use-scroll-to-text-input';

const mockUseWindowDimensions = jest.fn();
jest.mock( 'react-native/Libraries/Utilities/useWindowDimensions', () => ( {
	default: mockUseWindowDimensions,
} ) );

describe( 'useScrollToTextInput', () => {
	it( 'scrolls up to the TextInput offset when the caret is at the top of the screen', () => {
		// Arrange
		const currentCaretData = { caretHeight: 10 };
		const extraScrollHeight = 50;
		const keyboardOffset = 100;
		const scrollEnabled = true;
		const scrollViewRef = { current: { scrollTo: jest.fn() } };
		const scrollViewYOffset = { value: 150 };
		const textInputOffset = 50;
		const windowHeight = 600;
		mockUseWindowDimensions.mockReturnValue( { height: windowHeight } );

		const { result } = renderHook( () =>
			useScrollToTextInput(
				extraScrollHeight,
				keyboardOffset,
				scrollEnabled,
				scrollViewRef,
				scrollViewYOffset
			)
		);

		// Act
		result.current[ 0 ]( currentCaretData, textInputOffset );

		// Assert
		expect( scrollViewRef.current.scrollTo ).toHaveBeenCalledWith( {
			y: scrollViewYOffset.value - currentCaretData.caretHeight * 2,
			animated: true,
		} );
	} );

	it( 'scrolls down to the TextInput offset when the caret is at the bottom of the screen', () => {
		// Arrange
		const currentCaretData = { caretHeight: 10 };
		const extraScrollHeight = 50;
		const keyboardOffset = 100;
		const scrollEnabled = true;
		const scrollViewRef = { current: { scrollTo: jest.fn() } };
		const scrollViewYOffset = { value: 0 };
		const textInputOffset = 550;
		const windowHeight = 600;
		mockUseWindowDimensions.mockReturnValue( { height: windowHeight } );

		const { result } = renderHook( () =>
			useScrollToTextInput(
				extraScrollHeight,
				keyboardOffset,
				scrollEnabled,
				scrollViewRef,
				scrollViewYOffset
			)
		);

		// Act
		result.current[ 0 ]( currentCaretData, textInputOffset );

		// Assert
		const expectedYOffset =
			textInputOffset +
			extraScrollHeight -
			( windowHeight - ( keyboardOffset + extraScrollHeight ) ) +
			currentCaretData.caretHeight * 2;
		expect( scrollViewRef.current.scrollTo ).toHaveBeenCalledWith( {
			y: expectedYOffset,
			animated: true,
		} );
	} );

	it( 'does not scroll when the ScrollView ref is not available', () => {
		// Arrange
		const currentCaretData = { caretHeight: 10 };
		const extraScrollHeight = 50;
		const keyboardOffset = 100;
		const scrollEnabled = true;
		const scrollViewRef = { current: null };
		const scrollViewYOffset = { value: 0 };
		const textInputOffset = 50;
		const windowHeight = 600;
		mockUseWindowDimensions.mockReturnValue( { height: windowHeight } );

		const { result } = renderHook( () =>
			useScrollToTextInput(
				extraScrollHeight,
				keyboardOffset,
				scrollEnabled,
				scrollViewRef,
				scrollViewYOffset
			)
		);

		// Act
		result.current[ 0 ]( currentCaretData, textInputOffset );

		// Assert
		expect( scrollViewRef.current ).toBeNull();
	} );

	it( 'does not scroll when the scroll is not enabled', () => {
		// Arrange
		const currentCaretData = { caretHeight: 10 };
		const extraScrollHeight = 50;
		const keyboardOffset = 100;
		const scrollEnabled = false;
		const scrollViewRef = { current: { scrollTo: jest.fn() } };
		const scrollViewYOffset = { value: 0 };
		const textInputOffset = 50;
		const windowHeight = 600;
		mockUseWindowDimensions.mockReturnValue( { height: windowHeight } );

		const { result } = renderHook( () =>
			useScrollToTextInput(
				extraScrollHeight,
				keyboardOffset,
				scrollEnabled,
				scrollViewRef,
				scrollViewYOffset
			)
		);

		// Act
		result.current[ 0 ]( currentCaretData, textInputOffset );

		// Assert
		expect( scrollViewRef.current.scrollTo ).not.toHaveBeenCalled();
	} );
} );
