/**
 * External dependencies
 */
import { FlatList } from 'react-native';
import Animated, { useAnimatedScrollHandler } from 'react-native-reanimated';

/**
 * WordPress dependencies
 */
import { useRef, forwardRef, useImperativeHandle } from '@wordpress/element';

/**
 * Internal dependencies
 */
import KeyboardAvoidingView from '../keyboard-avoiding-view';

const AnimatedFlatList = Animated.createAnimatedComponent( FlatList );

export const KeyboardAwareFlatList = ( { onScroll, ...props }, ref ) => {
	const scrollHandler = useAnimatedScrollHandler( { onScroll } );
	const scrollViewRef = useRef();
	useImperativeHandle( ref, () => {
		return {
			scrollViewRef: scrollViewRef.current,
		};
	} );

	return (
		<KeyboardAvoidingView style={ { flex: 1 } }>
			<AnimatedFlatList
				ref={ scrollViewRef }
				onScroll={ scrollHandler }
				{ ...props }
			/>
		</KeyboardAvoidingView>
	);
};

export default forwardRef( KeyboardAwareFlatList );
