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
				{ ...optimizationProps }
				{ ...props }
			/>
		</KeyboardAvoidingView>
	);
};

export default forwardRef( KeyboardAwareFlatList );
