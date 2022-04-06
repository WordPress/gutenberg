/**
 * External dependencies
 */
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, runOnJS } from 'react-native-reanimated';
import TextInputState from 'react-native/Libraries/Components/TextInput/TextInputState';

/**
 * WordPress dependencies
 */
import { Platform } from '@wordpress/element';

/**
 * Draggable component
 *
 * @param {Object}                                      props                         Component props.
 * @param {JSX.Element}                                 props.children                Children to be rendered.
 * @param {number}                                      [props.maxDistance]           Maximum distance, that defines how far the finger is allowed to travel during a long press gesture.
 * @param {number}                                      [props.minDuration]           Minimum time, that a finger must remain pressed on the corresponding view.
 * @param {Function}                                    [props.onDragEnd]             Callback when dragging ends.
 * @param {Function}                                    [props.onDragOver]            Callback when dragging happens over an element.
 * @param {Function}                                    [props.onDragStart]           Callback when dragging starts.
 * @param {import('react-native-reanimated').StyleProp} [props.wrapperAnimatedStyles] Animated styles for the wrapper component.
 *
 * @return {JSX.Element} The component to be rendered.
 */
export default function Draggable( {
	children,
	maxDistance = 1000,
	minDuration = 450,
	onDragEnd,
	onDragOver,
	onDragStart,
	wrapperAnimatedStyles,
} ) {
	const isDragging = useSharedValue( false );
	const isAnyTextInputFocused = useSharedValue( false );

	const checkTextInputFocus = () => {
		isAnyTextInputFocused.value =
			TextInputState.currentlyFocusedInput() !== null;
	};

	const longPressGesture = Gesture.LongPress()
		.onBegin( () => {
			'worklet';
			runOnJS( checkTextInputFocus )();
		} )
		.onStart( ( ev ) => {
			'worklet';
			if ( isAnyTextInputFocused.value ) {
				return;
			}

			isDragging.value = true;

			if ( onDragStart ) {
				onDragStart( ev );
			}
		} )
		.onEnd( () => {
			'worklet';
			if ( isAnyTextInputFocused.value ) {
				return;
			}

			isDragging.value = false;
			if ( onDragEnd ) {
				onDragEnd();
			}
		} )
		.maxDistance( maxDistance )
		.minDuration( minDuration )
		.shouldCancelWhenOutside( false );

	const panGesture = Gesture.Pan()
		.manualActivation( true )
		.onTouchesMove( ( _, state ) => {
			'worklet';
			if ( isDragging.value ) {
				state.activate();
			} else if ( Platform.isIOS || isAnyTextInputFocused.value ) {
				state.fail();
			}
		} )
		.onUpdate( ( ev ) => {
			'worklet';
			if ( onDragOver ) {
				onDragOver( ev );
			}
		} )
		.shouldCancelWhenOutside( false );

	const dragHandler = Gesture.Simultaneous( panGesture, longPressGesture );

	return (
		<GestureDetector gesture={ dragHandler }>
			<Animated.View style={ wrapperAnimatedStyles }>
				{ children }
			</Animated.View>
		</GestureDetector>
	);
}
