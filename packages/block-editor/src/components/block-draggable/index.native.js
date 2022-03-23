/**
 * External dependencies
 */
import Animated, {
	interpolate,
	measure,
	runOnJS,
	runOnUI,
	useAnimatedRef,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
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

const CHIP_POSITION_PADDING = 32;
const BLOCK_COLLAPSED_HEIGHT = 20;

const BlockDraggableWrapper = ( { children } ) => {
	const { /*startDraggingBlocks,*/ stopDraggingBlocks } = useDispatch(
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

	const setDraggingBlockByPosition = () => {
		// TODO: Get clientId from blocks layouts data by position
		// startDraggingBlocks( [ clientIdFromBlocksLayouts ] );
	};

	const onChipLayout = ( { nativeEvent: { layout } } ) => {
		chip.width.value = layout.width;
		chip.height.value = layout.height;
	};

	const startDragging = ( { absoluteX, absoluteY } ) => {
		'worklet';
		const scrollLayout = measure( animatedScrollRef );
		scroll.x.value = scrollLayout.pageX;
		scroll.y.value = scrollLayout.pageY;

		const dragPosition = {
			x: absoluteX - scroll.x.value,
			y: absoluteY - scroll.y.value,
		};
		chip.x.value = dragPosition.x;
		chip.y.value = dragPosition.y;

		isDragging.value = true;

		chip.scale.value = withTiming( 1 );
		runOnJS( setDraggingBlockByPosition )( dragPosition );
		startScrolling( absoluteY );
	};

	const updateDragging = ( { absoluteX, absoluteY } ) => {
		'worklet';
		chip.x.value = absoluteX - scroll.x.value;
		chip.y.value = absoluteY - scroll.y.value;

		// Update scrolling velocity
		scrollOnDragOver( absoluteY );
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
						CHIP_POSITION_PADDING,
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
