/**
 * External dependencies
 */
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
const BLOCK_COLLAPSED_HEIGHT = 20;

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
		scale: useSharedValue( 0 ),
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

		chip.x.value = x - scroll.x.value;
		chip.y.value = y - scroll.y.value;

		isDragging.value = true;
		chip.scale.value = withTiming( 1 );

		startScrolling( y );
	};

	const updateDragging = ( { absoluteX: x, absoluteY: y } ) => {
		'worklet';
		// Update scrolling velocity
		scrollOnDragOver( y );

		chip.x.value = x - scroll.x.value;
		chip.y.value = y - scroll.y.value;
	};

	const stopDragging = () => {
		'worklet';
		chip.scale.value = withTiming( 0, ( completed ) => {
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
			transform: [
				{ translateX: chip.x.value - chip.width.value / 2 },
				{
					translateY:
						chip.y.value -
						chip.height.value -
						CHIP_POSITION_PADDING,
				},
				{ scaleX: chip.scale.value },
				{ scaleY: chip.scale.value },
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

	const container = {
		height: useSharedValue( 0 ),
	};
	const containerHeightBeforeDragging = useSharedValue( 0 );
	const collapseAnimation = useSharedValue( 0 );

	const onContainerLayout = ( { nativeEvent: { layout } } ) => {
		container.height.value = layout.height;
	};

	const startBlockDragging = ( event ) => {
		'worklet';
		startDragging( clientIds, event );
		containerHeightBeforeDragging.value = container.height.value;
		collapseAnimation.value = withTiming( 1 );
	};

	const stopBlockDragging = () => {
		'worklet';
		stopDragging();
		collapseAnimation.value = withTiming( 0 );
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

	const containerStyles = useAnimatedStyle( () => {
		const height = interpolate(
			collapseAnimation.value,
			[ 0, 1 ],
			[ containerHeightBeforeDragging.value, BLOCK_COLLAPSED_HEIGHT ]
		);
		return {
			height:
				containerHeightBeforeDragging.value === 0 ||
				collapseAnimation.value === 0
					? 'auto'
					: height,
		};
	} );

	const blockStyles = useAnimatedStyle( () => {
		return {
			opacity: 1 - collapseAnimation.value,
		};
	} );

	const placeholderStyles = useAnimatedStyle( () => {
		return {
			display: collapseAnimation.value === 0 ? 'none' : 'flex',
			opacity: collapseAnimation.value,
		};
	} );

	if ( ! isDraggable ) {
		return children( { isDraggable: false } );
	}

	return (
		<Animated.View onLayout={ onContainerLayout } style={ containerStyles }>
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
		</Animated.View>
	);
};

export { BlockDraggableWrapper };
export default BlockDraggable;
