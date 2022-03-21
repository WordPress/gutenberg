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
import { useBlockListContext } from '../block-list/block-list-context';
import styles from './style.scss';

const Context = createContext( { dragHandler: () => null } );
const { Provider } = Context;

const CHIP_POSITION_PADDING = 32;
const BLOCK_PLACEHOLDER_HEIGHT = 20;

const BlockDraggableWrapper = ( { children } ) => {
	const { startDraggingBlocks, stopDraggingBlocks } = useDispatch(
		blockEditorStore
	);

	const { scrollRef } = useBlockListContext();
	const animatedScrollRef = useAnimatedRef();
	animatedScrollRef( scrollRef );

	const scroll = {
		x: useSharedValue( 0 ),
		y: useSharedValue( 0 ),
	};
	const chip = {
		x: useSharedValue( 0 ),
		y: useSharedValue( 0 ),
		startX: useSharedValue( 0 ),
		startY: useSharedValue( 0 ),
		width: useSharedValue( 0 ),
		height: useSharedValue( 0 ),
		opacity: useSharedValue( 0 ),
	};
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

	const onChipLayout = ( { nativeEvent: { layout } } ) => {
		chip.width.value = layout.width;
		chip.height.value = layout.height;
	};

	const startDragging = ( clientIds, { absoluteX: x, absoluteY: y } ) => {
		'worklet';
		runOnJS( startDraggingBlocks )( clientIds );

		const scrollLayout = measure( animatedScrollRef );
		scroll.x.value = scrollLayout.pageX;
		scroll.y.value = scrollLayout.pageY;

		chip.x.value = x - scroll.x.value - chip.width.value / 2;
		chip.y.value =
			y - scroll.y.value - chip.height.value - CHIP_POSITION_PADDING;

		isDragging.value = true;
		chip.opacity.value = withTiming( 1 );

		startScrolling( y );
	};

	const updateDragging = ( { absoluteX: x, absoluteY: y } ) => {
		'worklet';
		// Update scrolling velocity
		scrollOnDragOver( y );

		chip.x.value = x - scroll.x.value - chip.width.value / 2;
		chip.y.value =
			y - scroll.y.value - chip.height.value - CHIP_POSITION_PADDING;
	};

	const stopDragging = () => {
		'worklet';
		chip.opacity.value = withTiming( 0.2, ( completed ) => {
			if ( completed ) {
				isDragging.value = false;
				runOnJS( stopDraggingBlocks )();
			}
		} );

		stopScrolling();
	};

	const chipStyles = useAnimatedStyle( () => {
		return {
			position: 'absolute',
			opacity: chip.opacity.value,
			transform: [
				{ translateX: chip.x.value },
				{ translateY: chip.y.value },
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
			<Animated.View
				onLayout={ onChipLayout }
				style={ chipStyles }
				pointerEvents="none"
			>
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
