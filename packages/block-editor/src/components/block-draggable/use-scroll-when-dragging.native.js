/**
 * External dependencies
 */
import { Dimensions } from 'react-native';
import {
	useSharedValue,
	useAnimatedRef,
	scrollTo,
	useAnimatedReaction,
	withTiming,
	withRepeat,
	cancelAnimation,
	Easing,
} from 'react-native-reanimated';

/**
 * Internal dependencies
 */
import { useBlockListContext } from '../block-list/block-list-context';

const SCROLL_VELOCITY = 180;
const SCROLL_THRESHOLD_LOW_VEL = 300;
const SCROLL_THRESHOLD_HIGH_VEL = 200;
const SCROLL_VELOCITY_MULTIPLIER = 3;

export default function useScrollWhenDragging() {
	const { scrollRef } = useBlockListContext();
	const animatedScrollRef = useAnimatedRef();
	animatedScrollRef( scrollRef );

	const windowHeight = Dimensions.get( 'window' ).height;

	const velocityY = useSharedValue( 0 );
	const offsetY = useSharedValue( 0 );

	const scroll = {
		offsetY: useSharedValue( 0 ),
		maxOffsetY: useSharedValue( 0 ),
	};

	const animation = useSharedValue( 0 );

	const scrollHandler = ( event ) => {
		'worklet';
		const { contentSize, contentOffset, layoutMeasurement } = event;
		scroll.offsetY.value = contentOffset.y;
		scroll.maxOffsetY.value = contentSize.height - layoutMeasurement.height;
	};

	const stopScrolling = () => {
		'worklet';
		velocityY.value = 0;
		cancelAnimation( animation );
	};

	const startScrolling = () => {
		'worklet';
		stopScrolling();
		offsetY.value = scroll.offsetY.value;
		animation.value = 0;
		animation.value = withRepeat(
			withTiming( 1, { duration: 1000, easing: Easing.linear } ),
			-1,
			true
		);
	};

	const scrollOnDragOver = ( y ) => {
		'worklet';
		if ( y < SCROLL_THRESHOLD_HIGH_VEL ) {
			velocityY.value = -SCROLL_VELOCITY * SCROLL_VELOCITY_MULTIPLIER;
		} else if ( y < SCROLL_THRESHOLD_LOW_VEL ) {
			velocityY.value = -SCROLL_VELOCITY;
		} else if ( y > windowHeight - SCROLL_THRESHOLD_HIGH_VEL ) {
			velocityY.value = SCROLL_VELOCITY * SCROLL_VELOCITY_MULTIPLIER;
		} else if ( y > windowHeight - SCROLL_THRESHOLD_LOW_VEL ) {
			velocityY.value = SCROLL_VELOCITY;
		} else {
			velocityY.value = 0;
		}
	};

	useAnimatedReaction(
		() => animation.value,
		( value, previous ) => {
			const delta = Math.abs( value - previous );
			let newOffset = offsetY.value + delta * velocityY.value;

			if ( scroll.maxOffsetY.value !== 0 ) {
				newOffset = Math.max(
					0,
					Math.min( scroll.maxOffsetY.value, newOffset )
				);
			} else {
				// Scroll values are empty until receiving the first scroll event.
				// In that case, the max offset is unknown and we can't clamp the
				// new offset value.
				newOffset = Math.max( 0, newOffset );
			}
			offsetY.value = newOffset;

			if ( velocityY.value !== 0 )
				scrollTo( animatedScrollRef, 0, offsetY.value, false );
		}
	);

	return [ startScrolling, scrollOnDragOver, stopScrolling, scrollHandler ];
}
