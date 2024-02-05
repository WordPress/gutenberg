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

const AnimatedFlatList = Animated.createAnimatedComponent( FlatList );

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
			// On Android, we get the ref of the associated scroll
			// view to the FlatList.
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

	return (
		<KeyboardAvoidingView style={ { flex: 1 } }>
			<AnimatedFlatList
				ref={ getFlatListRef }
				onScroll={ scrollHandler }
				onContentSizeChange={ onContentSizeChange }
				{ ...props }
			/>
		</KeyboardAvoidingView>
	);
};

export default forwardRef( KeyboardAwareFlatList );
