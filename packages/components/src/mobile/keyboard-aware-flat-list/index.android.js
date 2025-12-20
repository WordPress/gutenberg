/**
 * External dependencies
 */
import { FlatList } from 'react-native';
import Animated from 'react-native-reanimated';

/**
 * WordPress dependencies
 */
import {
	forwardRef,
	useCallback,
	useImperativeHandle,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import useScroll from './use-scroll';
import KeyboardAvoidingView from '../keyboard-avoiding-view';
import { OPTIMIZATION_ITEMS_THRESHOLD, OPTIMIZATION_PROPS } from './shared';

const AnimatedFlatList = Animated.createAnimatedComponent( FlatList );
const EMPTY_OBJECT = {};

export const KeyboardAwareFlatList = ( { onScroll, ...props }, ref ) => {
	const { extraScrollHeight, scrollEnabled, shouldPreventAutomaticScroll } =
		props;

	const {
		scrollViewRef,
		scrollHandler,
		scrollToSection,
		scrollToElement,
		onContentSizeChange,
		lastScrollTo,
	} = useScroll( {
		scrollEnabled,
		shouldPreventAutomaticScroll,
		extraScrollHeight,
		onScroll,
	} );

	const getFlatListRef = useCallback(
		( flatListRef ) => {
			scrollViewRef.current = flatListRef?.getNativeScrollRef();
		},
		[ scrollViewRef ]
	);

	useImperativeHandle( ref, () => {
		return {
			scrollViewRef: scrollViewRef.current,
			scrollToSection,
			scrollToElement,
			lastScrollTo,
		};
	} );

	const optimizationProps =
		props.data?.length > OPTIMIZATION_ITEMS_THRESHOLD
			? OPTIMIZATION_PROPS
			: EMPTY_OBJECT;

	return (
		<KeyboardAvoidingView style={ { flex: 1 } }>
			<AnimatedFlatList
				ref={ getFlatListRef }
				onScroll={ scrollHandler }
				onContentSizeChange={ onContentSizeChange }
				// Disable clipping to fix focus losing.
				// See https://github.com/wordpress-mobile/gutenberg-mobile/pull/741#issuecomment-472746541
				removeClippedSubviews={ false }
				{ ...optimizationProps }
				{ ...props }
			/>
		</KeyboardAvoidingView>
	);
};

export default forwardRef( KeyboardAwareFlatList );
