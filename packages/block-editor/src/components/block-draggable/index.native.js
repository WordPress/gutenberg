/**
 * External dependencies
 */
import { View } from 'react-native';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	runOnJS,
	withTiming,
	interpolate,
	useAnimatedRef,
	measure,
} from 'react-native-reanimated';

/**
 * WordPress dependencies
 */
import { Draggable } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useScrollWhenDragging from './use-scroll-when-dragging';
import DraggableChip from './draggable-chip';
import { store as blockEditorStore } from '../../store';
import styles from './style.scss';

const Context = createContext( { dragHandler: () => null } );
const { Provider } = Context;

const BLOCK_PLACEHOLDER_HEIGHT = 20;

const BlockDraggableWrapper = ( { children } ) => {
	const { startDraggingBlocks, stopDraggingBlocks } = useDispatch(
		blockEditorStore
	);

	const translation = {
		x: useSharedValue( 0 ),
		y: useSharedValue( 0 ),
		startX: useSharedValue( 0 ),
		startY: useSharedValue( 0 ),
	};
	const scale = useSharedValue( 0 );
	const isDragging = useSharedValue( false );

	const [
		startScrolling,
		scrollOnDragOver,
		stopScrolling,
		scrollHandler,
	] = useScrollWhenDragging();

	// Stop dragging blocks if the block draggable is unmounted.
	useEffect( () => {
		return () => {
			if ( isDragging.value ) {
				stopDraggingBlocks();
			}
		};
	}, [] );

	const startDragging = ( clientIds, { absoluteX: x, absoluteY: y } ) => {
		'worklet';
		runOnJS( startDraggingBlocks )( clientIds );

		translation.x.value = x;
		translation.y.value = y;

		isDragging.value = true;
		scale.value = withSpring( 1 );

		startScrolling( y );
	};

	const updateDragging = ( { absoluteX: x, absoluteY: y } ) => {
		'worklet';
		// Update scrolling velocity
		scrollOnDragOver( y );

		translation.x.value = x;
		translation.y.value = y;
	};

	const stopDragging = () => {
		'worklet';
		scale.value = withSpring( 0, ( completed ) => {
			if ( completed ) {
				isDragging.value = false;
				runOnJS( stopDraggingBlocks )();
			}
		} );

		stopScrolling();
	};

	const dragStyles = useAnimatedStyle( () => {
		return {
			position: 'absolute',
			top: 0,
			left: 0,
			transform: [
				{ translateX: translation.x.value },
				{ translateY: translation.y.value },
				{ scaleX: scale.value },
				{ scaleY: scale.value },
			],
		};
	} );

	return (
		<Provider
			value={ {
				startDragging,
				updateDragging,
				stopDragging,
			} }
		>
			{ children( { onScroll: scrollHandler } ) }
			<Animated.View style={ dragStyles }>
				<DraggableChip />
			</Animated.View>
		</Provider>
	);
};

const BlockDraggable = ( { clientIds, children } ) => {
	const { startDragging, updateDragging, stopDragging } = useContext(
		Context
	);

	const animatedContainerRef = useAnimatedRef();
	const container = {
		height: useSharedValue( 0 ),
		opacity: useSharedValue( 1 ),
	};

	const startBlockDragging = ( event ) => {
		'worklet';
		startDragging( clientIds, event );

		const containerLayout = measure( animatedContainerRef );
		container.height.value = containerLayout.height;

		container.opacity.value = withTiming( 0 );
	};

	const stopBlockDragging = () => {
		'worklet';
		stopDragging();
		container.opacity.value = withTiming( 1 );
	};

	const { isDraggable } = useSelect(
		( select ) => {
			const { getBlockRootClientId, getTemplateLock } = select(
				blockEditorStore
			);
			const rootClientId = getBlockRootClientId( clientIds[ 0 ] );
			const templateLock = rootClientId
				? getTemplateLock( rootClientId )
				: null;

			return {
				isDraggable: 'all' !== templateLock,
			};
		},
		[ clientIds ]
	);

	const blockStyles = useAnimatedStyle( () => {
		const height = interpolate(
			container.opacity.value,
			[ 0, 1 ],
			[ BLOCK_PLACEHOLDER_HEIGHT, container.height.value ]
		);

		return {
			opacity: container.opacity.value,
			height: container.opacity.value === 1 ? 'auto' : height,
		};
	} );

	const placeholderStyles = useAnimatedStyle( () => {
		const height = interpolate(
			container.opacity.value,
			[ 0, 1 ],
			[ BLOCK_PLACEHOLDER_HEIGHT, container.height.value ]
		);

		return {
			display: container.opacity.value === 1 ? 'none' : 'flex',
			opacity: 1 - container.opacity.value,
			height,
		};
	} );

	if ( ! isDraggable ) {
		return children( { isDraggable: false } );
	}

	return (
		<View ref={ animatedContainerRef }>
			<Draggable
				onDragStart={ startBlockDragging }
				onDragOver={ updateDragging }
				onDragEnd={ stopBlockDragging }
				wrapperAnimatedStyles={ blockStyles }
			>
				{ children( { isDraggable: true } ) }
			</Draggable>
			<Animated.View
				style={ [
					styles[ 'draggable-placeholder__container' ],
					placeholderStyles,
				] }
				pointerEvents="none"
			/>
		</View>
	);
};

export { BlockDraggableWrapper };
export default BlockDraggable;
