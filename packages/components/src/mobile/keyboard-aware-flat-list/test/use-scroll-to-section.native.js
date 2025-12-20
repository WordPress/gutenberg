/**
 * External dependencies
 */

import { renderHook } from '@testing-library/react-native';

/**
 * Internal dependencies
 */
import useScrollToSection from '../use-scroll-to-section';

describe( 'useScrollToSection', () => {
	it( 'scrolls up to the section', () => {
		// Arrange
		const sectionY = 50;
		const sectionHeight = 10;

		const extraScrollHeight = 50;
		const keyboardOffset = 100;
		const scrollEnabled = true;
		const scrollViewRef = { current: { scrollTo: jest.fn() } };
		const scrollViewMeasurements = { current: { height: 600 } };
		const scrollViewYOffset = { value: 150 };

		const { result } = renderHook( () =>
			useScrollToSection(
				extraScrollHeight,
				keyboardOffset,
				scrollEnabled,
				scrollViewMeasurements,
				scrollViewRef,
				scrollViewYOffset
			)
		);

		// Act
		result.current[ 0 ]( sectionY, sectionHeight );

		// Assert
		expect( scrollViewRef.current.scrollTo ).toHaveBeenCalledWith( {
			y: sectionY,
			animated: true,
		} );
	} );

	it( 'scrolls down to the section', () => {
		// Arrange
		const sectionY = 750;
		const sectionHeight = 10;

		const extraScrollHeight = 50;
		const keyboardOffset = 100;
		const scrollEnabled = true;
		const scrollViewRef = { current: { scrollTo: jest.fn() } };
		const scrollViewMeasurements = { current: { height: 600 } };
		const scrollViewYOffset = { value: 250 };

		const { result } = renderHook( () =>
			useScrollToSection(
				extraScrollHeight,
				keyboardOffset,
				scrollEnabled,
				scrollViewMeasurements,
				scrollViewRef,
				scrollViewYOffset
			)
		);

		// Act
		result.current[ 0 ]( sectionY, sectionHeight );

		// Assert
		const expectedYOffset =
			sectionY -
			( scrollViewMeasurements.current.height -
				( keyboardOffset + extraScrollHeight + sectionHeight ) );
		expect( scrollViewRef.current.scrollTo ).toHaveBeenCalledWith( {
			y: expectedYOffset,
			animated: true,
		} );
	} );

	it( 'does not scroll when the ScrollView ref is not available', () => {
		// Arrange
		const sectionY = 50;
		const sectionHeight = 10;

		const extraScrollHeight = 50;
		const keyboardOffset = 100;
		const scrollEnabled = true;
		const scrollViewRef = { current: null };
		const scrollViewMeasurements = { current: { height: 600 } };
		const scrollViewYOffset = { value: 0 };

		const { result } = renderHook( () =>
			useScrollToSection(
				extraScrollHeight,
				keyboardOffset,
				scrollEnabled,
				scrollViewMeasurements,
				scrollViewRef,
				scrollViewYOffset
			)
		);

		// Act
		result.current[ 0 ]( sectionY, sectionHeight );

		// Assert
		expect( scrollViewRef.current ).toBeNull();
	} );

	it( 'does not scroll when the scroll is not enabled', () => {
		// Arrange
		const sectionY = 50;
		const sectionHeight = 10;

		const extraScrollHeight = 50;
		const keyboardOffset = 100;
		const scrollEnabled = false;
		const scrollViewRef = { current: { scrollTo: jest.fn() } };
		const scrollViewMeasurements = { current: { height: 600 } };
		const scrollViewYOffset = { value: 0 };

		const { result } = renderHook( () =>
			useScrollToSection(
				extraScrollHeight,
				keyboardOffset,
				scrollEnabled,
				scrollViewMeasurements,
				scrollViewRef,
				scrollViewYOffset
			)
		);

		// Act
		result.current[ 0 ]( sectionY, sectionHeight );

		// Assert
		expect( scrollViewRef.current.scrollTo ).not.toHaveBeenCalled();
	} );
} );
