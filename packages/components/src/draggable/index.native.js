/**
 * External dependencies
 */
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue } from 'react-native-reanimated';

export default function Draggable( {
	children,
	maxDistance = 1000,
	minDuration = 10,
	onDragEnd,
	onDragOver,
	onDragStart,
	wrapperAnimatedStyles,
} ) {
	const isDragging = useSharedValue( false );

	const dragHandler = Gesture.Simultaneous(
		Gesture.LongPress().onStart( ( ev ) => {
			'worklet';
			isDragging.value = true;

			if ( onDragStart ) {
				onDragStart( ev );
			}
		} ),
		Gesture.Pan()
			.onEnd( () => {
				'worklet';
				isDragging.value = false;
			} )
			.onUpdate( ( ev ) => {
				'worklet';
				if ( isDragging.value ) {
					if ( onDragOver ) {
						onDragOver( ev );
					}
				}
			} )
			.onFinalize( () => {
				'worklet';
				isDragging.value = false;

				if ( onDragEnd ) {
					onDragEnd();
				}
			} )
	);

	return (
		<GestureDetector
			shouldCancelWhenOutside={ false }
			maxDistance={ maxDistance }
			minDuration={ minDuration }
			gesture={ dragHandler }
		>
			<Animated.View style={ wrapperAnimatedStyles }>
				{ children }
			</Animated.View>
		</GestureDetector>
	);
}
