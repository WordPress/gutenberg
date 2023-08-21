/**
 * External dependencies
 */

import { renderHook } from '@testing-library/react-native';

/**
 * Internal dependencies
 */
import useScrollToTextInput from '../use-scroll-to-text-input';

describe( 'useScrollToTextInput', () => {
	it( 'scrolls up to the current TextInput offset', () => {
		// Arrange
		const currentCaretData = { caretHeight: 10 };
		const extraScrollHeight = 50;
		const keyboardOffset = 100;
		const scrollEnabled = true;
		const scrollViewRef = { current: { scrollTo: jest.fn() } };
		const scrollViewMeasurements = { current: { height: 600 } };
		const scrollViewYOffset = { value: 150 };
		const textInputOffset = 50;

		const { result } = renderHook( () =>
			useScrollToTextInput(
				extraScrollHeight,
				keyboardOffset,
				scrollEnabled,
				scrollViewMeasurements,
				scrollViewRef,
				scrollViewYOffset
			)
		);

		// Act
		result.current[ 0 ]( currentCaretData, textInputOffset );

		// Assert
		expect( scrollViewRef.current.scrollTo ).toHaveBeenCalledWith( {
			y: textInputOffset,
			animated: true,
		} );
	} );

	it( 'scrolls down to the current TextInput offset', () => {
		// Arrange
		const currentCaretData = { caretHeight: 10 };
		const extraScrollHeight = 50;
		const keyboardOffset = 100;
		const scrollEnabled = true;
		const scrollViewRef = { current: { scrollTo: jest.fn() } };
		const scrollViewMeasurements = { current: { height: 600 } };
		const scrollViewYOffset = { value: 250 };
		const textInputOffset = 750;

		const { result } = renderHook( () =>
			useScrollToTextInput(
				extraScrollHeight,
				keyboardOffset,
				scrollEnabled,
				scrollViewMeasurements,
				scrollViewRef,
				scrollViewYOffset
			)
		);

		// Act
		result.current[ 0 ]( currentCaretData, textInputOffset );

		// Assert
		const expectedYOffset =
			textInputOffset -
			( scrollViewMeasurements.current.height -
				( keyboardOffset +
					extraScrollHeight +
					currentCaretData.caretHeight ) );
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
		const scrollViewMeasurements = { current: { height: 600 } };
		const scrollViewYOffset = { value: 0 };
		const textInputOffset = 50;

		const { result } = renderHook( () =>
			useScrollToTextInput(
				extraScrollHeight,
				keyboardOffset,
				scrollEnabled,
				scrollViewMeasurements,
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
		const scrollViewMeasurements = { current: { height: 600 } };
		const scrollViewYOffset = { value: 0 };
		const textInputOffset = 50;

		const { result } = renderHook( () =>
			useScrollToTextInput(
				extraScrollHeight,
				keyboardOffset,
				scrollEnabled,
				scrollViewMeasurements,
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
