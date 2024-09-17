/**
 * External dependencies
 */

import { renderHook } from 'test/helpers';

/**
 * Internal dependencies
 */
import useScroll from '../use-scroll';

// Mock Reanimated with default mock
jest.mock( 'react-native-reanimated', () => ( {
	...require( 'react-native-reanimated/mock' ),
	useAnimatedScrollHandler: jest.fn( ( args ) => args ),
} ) );

describe( 'useScroll', () => {
	it( 'scrolls using current scroll position', () => {
		const sectionY = 50;
		const sectionHeight = 10;
		const scrollViewMeasurements = { x: 0, y: 0, width: 0, height: 600 };
		const extraScrollHeight = 50;
		const scrollEnabled = true;
		const shouldPreventAutomaticScroll = false;

		const scrollTo = jest.fn();
		const measureInWindow = jest.fn( ( callback ) =>
			callback( ...Object.values( scrollViewMeasurements ) )
		);
		const scrollRef = { scrollTo, measureInWindow };
		const onScroll = jest.fn();
		const onSizeChange = jest.fn();

		const { result } = renderHook( () =>
			useScroll( {
				scrollEnabled,
				shouldPreventAutomaticScroll,
				onScroll,
				onSizeChange,
				extraScrollHeight,
			} )
		);
		const {
			scrollViewRef,
			onContentSizeChange,
			scrollHandler,
			scrollToSection,
		} = result.current;

		// Assign ref
		scrollViewRef.current = scrollRef;

		// Check content size changes
		onContentSizeChange();
		expect( measureInWindow ).toHaveBeenCalled();
		expect( onSizeChange ).toHaveBeenCalled();

		// Set up initial scroll offset
		scrollHandler.onScroll( { contentOffset: { y: 150 } } );

		// Scroll to section
		scrollToSection( sectionY, sectionHeight );

		// Assert
		expect( scrollTo ).toHaveBeenCalledWith( {
			y: sectionY,
			animated: true,
		} );
	} );
} );
