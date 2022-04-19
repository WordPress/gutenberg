/**
 * External dependencies
 */
import {
	Gesture,
	GestureDetector,
	LongPressGestureHandler,
} from 'react-native-gesture-handler';
import Animated, {
	useSharedValue,
	runOnJS,
	useAnimatedReaction,
	useAnimatedGestureHandler,
} from 'react-native-reanimated';

/**
 * WordPress dependencies
 */
import { createContext, useContext, useRef, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const Context = createContext( {} );
const { Provider } = Context;

/**
 * Draggable component.
 *
 * @param {Object}      props               Component props.
 * @param {JSX.Element} props.children      Children to be rendered.
 * @param {Function}    [props.onDragEnd]   Callback when dragging ends.
 * @param {Function}    [props.onDragOver]  Callback when dragging happens over an element.
 * @param {Function}    [props.onDragStart] Callback when dragging starts.
 *
 * @return {JSX.Element} The component to be rendered.
 */
const Draggable = ( { children, onDragEnd, onDragOver, onDragStart } ) => {
	const isDragging = useSharedValue( false );
	const isPanActive = useSharedValue( false );
	const draggingId = useSharedValue( '' );
	const panGestureRef = useRef();

	const initialPosition = {
		x: useSharedValue( 0 ),
		y: useSharedValue( 0 ),
	};
	const lastPosition = {
		x: useSharedValue( 0 ),
		y: useSharedValue( 0 ),
	};

	useAnimatedReaction(
		() => isDragging.value,
		( result, previous ) => {
			if ( result === previous || previous === null ) {
				return;
			}

			if ( result ) {
				if ( onDragStart ) {
					onDragStart( {
						x: initialPosition.x.value,
						y: initialPosition.y.value,
						id: draggingId.value,
					} );
				}
			} else if ( onDragEnd ) {
				onDragEnd( {
					x: lastPosition.x.value,
					y: lastPosition.y.value,
					id: draggingId.value,
				} );
			}
		}
	);

	const panGesture = Gesture.Pan()
		.manualActivation( true )
		.onTouchesDown( ( event ) => {
			const { x = 0, y = 0 } = event.allTouches[ 0 ];
			initialPosition.x.value = x;
			initialPosition.y.value = y;
		} )
		.onTouchesMove( ( _, state ) => {
			if ( ! isPanActive.value && isDragging.value ) {
				isPanActive.value = true;
				state.activate();
			}
		} )
		.onUpdate( ( event ) => {
			lastPosition.x.value = event.x;
			lastPosition.y.value = event.y;

			if ( onDragOver ) {
				onDragOver( event );
			}
		} )
		.onEnd( () => {
			isPanActive.value = false;
			isDragging.value = false;
		} )
		.withRef( panGestureRef )
		.shouldCancelWhenOutside( false );

	const providerValue = useMemo( () => {
		return { panGestureRef, isDragging, draggingId };
	}, [] );

	return (
		<GestureDetector gesture={ panGesture }>
			<Animated.View style={ styles.draggable__container }>
				<Provider value={ providerValue }>{ children }</Provider>
			</Animated.View>
		</GestureDetector>
	);
};

/**
 * Draggable trigger component.
 *
 * This component acts as the trigger for the dragging functionality.
 *
 * @param {Object}      props                  Component props.
 * @param {JSX.Element} props.children         Children to be rendered.
 * @param {*}           props.id               Identifier passed within the event callbacks.
 * @param {boolean}     [props.enabled]        Enables the long-press gesture.
 * @param {number}      [props.maxDistance]    Maximum distance, that defines how far the finger is allowed to travel during a long press gesture.
 * @param {number}      [props.minDuration]    Minimum time, that a finger must remain pressed on the corresponding view.
 * @param {Function}    [props.onLongPress]    Callback when long-press gesture is triggered over an element.
 * @param {Function}    [props.onLongPressEnd] Callback when long-press gesture ends.
 *
 * @return {JSX.Element} The component to be rendered.
 */
const DraggableTrigger = ( {
	children,
	enabled = true,
	id,
	maxDistance = 1000,
	minDuration = 500,
	onLongPress,
	onLongPressEnd,
} ) => {
	const { panGestureRef, isDragging, draggingId } = useContext( Context );

	const gestureHandler = useAnimatedGestureHandler( {
		onActive: () => {
			if ( isDragging.value ) {
				return;
			}

			isDragging.value = true;
			draggingId.value = id;
			if ( onLongPress ) {
				runOnJS( onLongPress )( id );
			}
		},
		onEnd: () => {
			isDragging.value = false;
			if ( onLongPressEnd ) {
				runOnJS( onLongPressEnd )( id );
			}
		},
	} );

	return (
		<LongPressGestureHandler
			enabled={ enabled }
			minDurationMs={ minDuration }
			maxDist={ maxDistance }
			simultaneousHandlers={ panGestureRef }
			shouldCancelWhenOutside={ false }
			onGestureEvent={ gestureHandler }
		>
			{ children }
		</LongPressGestureHandler>
	);
};

export { DraggableTrigger };
export default Draggable;
