/**
 * External dependencies
 */
import Animated, {
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
import { useEffect, useRef } from '@wordpress/element';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import useScrollWhenDragging from './use-scroll-when-dragging';
import DraggableChip from './draggable-chip';
import { store as blockEditorStore } from '../../store';
import { useBlockListContext } from '../block-list/block-list-context';
import DroppingInsertionPoint from './dropping-insertion-point';
import useBlockDropZone from '../use-block-drop-zone';
import styles from './style.scss';

const CHIP_OFFSET_TO_TOUCH_POSITION = 32;
const BLOCK_OPACITY_ANIMATION_CONFIG = { duration: 350 };

/**
 * Block draggable wrapper component
 *
 * This component handles all the interactions for dragging blocks.
 * It relies on the block list and its context for dragging, hence it
 * should be rendered between the `BlockListProvider` component and the
 * block list rendering. It also requires listening to scroll events,
 * therefore for this purpose, it returns the `onScroll` event handler
 * that should be attached to the list that renders the blocks.
 *
 *
 * @param {Object}      props          Component props.
 * @param {JSX.Element} props.children Children to be rendered.
 *
 * @return {Function} Render function that passes `onScroll` event handler.
 */
const BlockDraggableWrapper = ( { children } ) => {
	const currentBlockLayout = useRef();

	const wrapperStyles = usePreferredColorSchemeStyle(
		styles[ 'draggable-wrapper__container' ],
		styles[ 'draggable-wrapper__container--dark' ]
	);

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

	const {
		onBlockDragOver,
		onBlockDragEnd,
		onBlockDrop,
		targetBlockIndex,
	} = useBlockDropZone();

	// Stop dragging blocks if the block draggable is unmounted.
	useEffect( () => {
		return () => {
			if ( isDragging.value ) {
				stopDraggingBlocks();
			}
		};
	}, [] );

	const onStartDragging = ( position ) => {
		const blockLayout = findBlockLayoutByPosition( blocksLayouts.current, {
			x: position.x,
			y: position.y + scroll.offsetY.value,
		} );

		const foundClientId = blockLayout?.clientId;
		currentBlockLayout.current = blockLayout;
		if ( foundClientId ) {
			startDraggingBlocks( [ foundClientId ] );
			runOnUI( startScrolling )( position.y );
		} else {
			// We stop dragging if no block is found.
			runOnUI( stopDragging )();
		}
	};

	const onStopDragging = () => {
		if ( currentBlockLayout.current ) {
			onBlockDrop( {
				// Dropping is only allowed at root level
				srcRootClientId: '',
				srcClientIds: [ currentBlockLayout.current.clientId ],
				type: 'block',
			} );
		}
		onBlockDragEnd();
		stopDraggingBlocks();
	};

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
		runOnJS( onStartDragging )( dragPosition );
	};

	const updateDragging = ( { x, y } ) => {
		'worklet';
		const dragPosition = { x, y };
		chip.x.value = dragPosition.x;
		chip.y.value = dragPosition.y;

		runOnJS( onBlockDragOver )( { x, y: y + scroll.offsetY.value } );

		// Update scrolling velocity
		scrollOnDragOver( dragPosition.y );
	};

	const stopDragging = () => {
		'worklet';
		isDragging.value = false;

		chip.scale.value = withTiming( 0 );
		stopScrolling();
		runOnJS( onStopDragging )();
	};

	const chipDynamicStyles = useAnimatedStyle( () => {
		return {
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
	const chipStyles = [
		chipDynamicStyles,
		styles[ 'draggable-chip__wrapper' ],
	];

	return (
		<>
			<DroppingInsertionPoint
				scroll={ scroll }
				isDragging={ isDragging }
				targetBlockIndex={ targetBlockIndex }
			/>

			<Draggable
				onDragStart={ startDragging }
				onDragOver={ updateDragging }
				onDragEnd={ stopDragging }
				wrapperAnimatedStyles={ wrapperStyles }
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

/**
 * Block draggable component
 *
 * This component serves for animating the block when it is being dragged.
 * Hence, it should be wrapped around the rendering of a block.
 *
 * @param {Object}      props          Component props.
 * @param {JSX.Element} props.children Children to be rendered.
 * @param {string[]}    props.clientId Client id of the block.
 *
 * @return {Function} Render function which includes the parameter `isDraggable` to determine if the block can be dragged.
 */
const BlockDraggable = ( { clientId, children } ) => {
	const { selectBlock } = useDispatch( blockEditorStore );
	const wasBeingDragged = useRef( false );

	const draggingAnimation = {
		opacity: useSharedValue( 1 ),
	};

	const startDraggingBlock = () => {
		draggingAnimation.opacity.value = withTiming(
			0.4,
			BLOCK_OPACITY_ANIMATION_CONFIG
		);
	};

	const stopDraggingBlock = () => {
		draggingAnimation.opacity.value = withTiming(
			1,
			BLOCK_OPACITY_ANIMATION_CONFIG
		);
		runOnJS( selectBlock )( clientId );
	};

	const { isDraggable, isBeingDragged } = useSelect(
		( select ) => {
			const {
				getBlockRootClientId,
				getTemplateLock,
				isBlockBeingDragged,
			} = select( blockEditorStore );
			const rootClientId = getBlockRootClientId( clientId );
			const templateLock = rootClientId
				? getTemplateLock( rootClientId )
				: null;

			return {
				isBeingDragged: isBlockBeingDragged( clientId ),
				isDraggable: 'all' !== templateLock,
			};
		},
		[ clientId ]
	);

	useEffect( () => {
		if ( isBeingDragged ) {
			startDraggingBlock();
			wasBeingDragged.current = true;
		} else if ( wasBeingDragged.current ) {
			stopDraggingBlock();
			wasBeingDragged.current = false;
		}
	}, [ isBeingDragged ] );

	const wrapperStyles = useAnimatedStyle( () => {
		return {
			opacity: draggingAnimation.opacity.value,
		};
	} );

	if ( ! isDraggable ) {
		return children( { isDraggable: false } );
	}

	return (
		<Animated.View style={ wrapperStyles }>
			{ children( { isDraggable: true } ) }
		</Animated.View>
	);
};

export { BlockDraggableWrapper };
export default BlockDraggable;
