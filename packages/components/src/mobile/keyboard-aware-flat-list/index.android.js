/**
 * External dependencies
 */
import { FlatList } from 'react-native';
import Animated, { useAnimatedScrollHandler } from 'react-native-reanimated';

/**
 * Internal dependencies
 */
import KeyboardAvoidingView from '../keyboard-avoiding-view';

const AnimatedFlatList = Animated.createAnimatedComponent( FlatList );

export const KeyboardAwareFlatList = ( { innerRef, onScroll, ...props } ) => {
	const scrollHandler = useAnimatedScrollHandler( { onScroll } );
	return (
		<KeyboardAvoidingView style={ { flex: 1 } }>
			<AnimatedFlatList
				ref={ innerRef }
				onScroll={ scrollHandler }
				{ ...props }
			/>
		</KeyboardAvoidingView>
	);
};

KeyboardAwareFlatList.handleCaretVerticalPositionChange = () => {
	// no need to handle on Android, it is system managed
};

export default KeyboardAwareFlatList;
