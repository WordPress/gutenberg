/**
 * External dependencies
 */
import Animated, {
	interpolate,
	runOnJS,
	runOnUI,
	useAnimatedRef,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
	scrollTo,
	useAnimatedReaction,
} from 'react-native-reanimated';

/**
 * WordPress dependencies
 */
import { Draggable } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useScrollWhenDragging from './use-scroll-when-dragging';
import DraggableChip from './draggable-chip';
import { store as blockEditorStore } from '../../store';
import { useBlockListContext } from '../block-list/block-list-context';
import styles from './style.scss';

const CHIP_OFFSET_TO_TOUCH_POSITION = 32;
const BLOCK_COLLAPSED_HEIGHT = 20;
const EXTRA_OFFSET_WHEN_CLOSE_TO_TOP_EDGE = 80;
const SCROLL_ANIMATION_DURATION = 350;

const BlockDraggableWrapper = ( { children } ) => {
	const { startDraggingBlocks, stopDraggingBlocks } = useDispatch(
		blockEditorStore
	);

	const {
		blocksLayouts,
		scrollRef,
		findBlockLayoutByPosition,
	} = useBlockListContext();
	const animatedScrollRef = useAnimatedRef();
	animatedScrollRef( scrollRef );

	const scroll = {
		offsetY: useSharedValue( 0 ),
	};
	const chip = {
		x: useSharedValue( 0 ),
		y: useSharedValue( 0 ),
		width: useSharedValue( 0 ),
		height: useSharedValue( 0 ),
		scale: useSharedValue( 0 ),
	};
	const isDragging = useSharedValue( false );
	const scrollAnimation = useSharedValue( 0 );

	const [
		startScrolling,
		scrollOnDragOver,
		stopScrolling,
		draggingScrollHandler,
	] = useScrollWhenDragging();

	const scrollHandler = ( event ) => {
		'worklet';
		const { contentOffset } = event;
		scroll.offsetY.value = contentOffset.y;

		draggingScrollHandler( event );
	};

	// Stop dragging blocks if the block draggable is unmounted.
	useEffect( () => {
		return () => {
			if ( isDragging.value ) {
				stopDraggingBlocks();
			}
		};
	}, [] );

	const setupDraggingBlock = ( position ) => {
		const blockLayout = findBlockLayoutByPosition( blocksLayouts.current, {
			x: position.x,
			y: position.y + scroll.offsetY.value,
		} );

		const foundClientId = blockLayout?.clientId;
		if ( foundClientId ) {
			startDraggingBlocks( [ foundClientId ] );

			const isBlockOutOfScrollView = blockLayout.y < scroll.offsetY.value;
			// If the dragging block is out of the scroll view, we have to
			// scroll the block list to show the origin position of the block.
			if ( isBlockOutOfScrollView ) {
				scrollAnimation.value = scroll.offsetY.value;
				const scrollOffsetTarget = Math.max(
					0,
					scroll.offsetY.value -
						( scroll.offsetY.value - blockLayout.y ) -
						EXTRA_OFFSET_WHEN_CLOSE_TO_TOP_EDGE
				);
				scrollAnimation.value = withTiming(
					scrollOffsetTarget,
					{ duration: SCROLL_ANIMATION_DURATION },
					() => startScrolling( position.y )
				);
			} else {
				runOnUI( startScrolling )( position.y );
			}
		} else {
			// We stop dragging If no block is found.
			runOnUI( stopDragging )();
		}
	};

	// This hook is used for animating the scroll via a shared value.
	useAnimatedReaction(
		() => scrollAnimation.value,
		( value ) => {
			if ( isDragging.value ) {
				scrollTo( animatedScrollRef, 0, value, false );
			}
		}
	);

	const onChipLayout = ( { nativeEvent: { layout } } ) => {
		chip.width.value = layout.width;
		chip.height.value = layout.height;
	};

	const startDragging = ( { x, y } ) => {
		'worklet';
		const dragPosition = { x, y };
		chip.x.value = dragPosition.x;
		chip.y.value = dragPosition.y;

		isDragging.value = true;

		chip.scale.value = withTiming( 1 );
		runOnJS( setupDraggingBlock )( dragPosition );
	};

	const updateDragging = ( { x, y } ) => {
		'worklet';
		const dragPosition = { x, y };
		chip.x.value = dragPosition.x;
		chip.y.value = dragPosition.y;

		// Update scrolling velocity
		scrollOnDragOver( dragPosition.y );
	};

	const stopDragging = () => {
		'worklet';
		isDragging.value = false;

		chip.scale.value = withTiming( 0 );
		runOnJS( stopDraggingBlocks )();
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
						CHIP_OFFSET_TO_TOUCH_POSITION,
				},
				{ scaleX: chip.scale.value },
				{ scaleY: chip.scale.value },
			],
		};
	} );

	return (
		<>
			<Draggable
				onDragStart={ startDragging }
				onDragOver={ updateDragging }
				onDragEnd={ stopDragging }
				wrapperAnimatedStyles={ { flex: 1 } }
			>
				{ children( { onScroll: scrollHandler } ) }
			</Draggable>
			<Animated.View
				onLayout={ onChipLayout }
				style={ chipStyles }
				pointerEvents="none"
			>
				<DraggableChip />
			</Animated.View>
		</>
	);
};

const BlockDraggable = ( { clientIds, children } ) => {
	const container = {
		height: useSharedValue( 0 ),
	};
	const containerHeightBeforeDragging = useSharedValue( 0 );
	const collapseAnimation = useSharedValue( 0 );

	const onContainerLayout = ( { nativeEvent: { layout } } ) => {
		container.height.value = layout.height;
	};

	const startBlockDragging = () => {
		'worklet';
		containerHeightBeforeDragging.value = container.height.value;
		collapseAnimation.value = withTiming( 1 );
	};

	const stopBlockDragging = () => {
		'worklet';
		collapseAnimation.value = withTiming( 0 );
	};

	const { isDraggable, isBeingDragged } = useSelect(
		( select ) => {
			const {
				getBlockRootClientId,
				getTemplateLock,
				isBlockBeingDragged,
			} = select( blockEditorStore );
			const rootClientId = getBlockRootClientId( clientIds[ 0 ] );
			const templateLock = rootClientId
				? getTemplateLock( rootClientId )
				: null;

			return {
				isBeingDragged: isBlockBeingDragged( clientIds[ 0 ] ),
				isDraggable: 'all' !== templateLock,
			};
		},
		[ clientIds ]
	);

	useEffect( () => {
		if ( isBeingDragged ) {
			runOnUI( startBlockDragging )();
		} else {
			runOnUI( stopBlockDragging )();
		}
	}, [ isBeingDragged ] );

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
			<Animated.View style={ blockStyles }>
				{ children( { isDraggable: true } ) }
			</Animated.View>
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
