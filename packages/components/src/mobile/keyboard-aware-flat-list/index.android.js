/**
 * External dependencies
 */
import { FlatList } from 'react-native';
import Animated from 'react-native-reanimated';

/**
 * WordPress dependencies
 */
import { forwardRef, useImperativeHandle } from '@wordpress/element';

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
	} = useScroll( {
		scrollEnabled,
		shouldPreventAutomaticScroll,
		extraScrollHeight,
		onScroll,
	} );

	useImperativeHandle( ref, () => {
		return {
			scrollViewRef: scrollViewRef.current,
			scrollToSection,
			scrollToElement,
		};
	} );

	return (
		<KeyboardAvoidingView style={ { flex: 1 } }>
			<AnimatedFlatList
				ref={ scrollViewRef }
				onScroll={ scrollHandler }
				onContentSizeChange={ onContentSizeChange }
				{ ...props }
			/>
		</KeyboardAvoidingView>
	);
};

export default forwardRef( KeyboardAwareFlatList );
