/**
 * External dependencies
 */
import Animated, {
	runOnJS,
	runOnUI,
	useAnimatedRef,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withTiming,
} from 'react-native-reanimated';
import TextInputState from 'react-native/Libraries/Components/TextInput/TextInputState';

/**
 * WordPress dependencies
 */
import { Draggable, DraggableTrigger } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef, useState, Platform } from '@wordpress/element';

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
const BLOCK_OPACITY_ANIMATION_DELAY = 250;
const DEFAULT_LONG_PRESS_MIN_DURATION = 500;
const DEFAULT_IOS_LONG_PRESS_MIN_DURATION =
	DEFAULT_LONG_PRESS_MIN_DURATION - 50;

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
	const [ currentClientId, setCurrentClientId ] = useState();

	const {
		selectBlock,
		startDraggingBlocks,
		stopDraggingBlocks,
	} = useDispatch( blockEditorStore );

	const { scrollRef } = useBlockListContext();
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

	const onStartDragging = ( { clientId, position } ) => {
		if ( clientId ) {
			startDraggingBlocks( [ clientId ] );
			setCurrentClientId( clientId );
			runOnUI( startScrolling )( position.y );
		} else {
			// We stop dragging if no block is found.
			runOnUI( stopDragging )();
		}
	};

	const onStopDragging = () => {
		if ( currentClientId ) {
			onBlockDrop( {
				// Dropping is only allowed at root level
				srcRootClientId: '',
				srcClientIds: [ currentClientId ],
				type: 'block',
			} );
			selectBlock( currentClientId );
			setCurrentClientId( undefined );
		}
		onBlockDragEnd();
		stopDraggingBlocks();
	};

	const onChipLayout = ( { nativeEvent: { layout } } ) => {
		chip.width.value = layout.width;
		chip.height.value = layout.height;
	};

	const startDragging = ( { x, y, id } ) => {
		'worklet';
		const dragPosition = { x, y };
		chip.x.value = dragPosition.x;
		chip.y.value = dragPosition.y;

		isDragging.value = true;

		chip.scale.value = withTiming( 1 );
		runOnJS( onStartDragging )( { clientId: id, position: dragPosition } );
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
 * @param {Object}      props           Component props.
 * @param {JSX.Element} props.children  Children to be rendered.
 * @param {string[]}    props.clientId  Client id of the block.
 * @param {boolean}     [props.enabled] Enables the draggable trigger.
 *
 * @return {Function} Render function which includes the parameter `isDraggable` to determine if the block can be dragged.
 */
const BlockDraggable = ( { clientId, children, enabled = true } ) => {
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
		draggingAnimation.opacity.value = withDelay(
			BLOCK_OPACITY_ANIMATION_DELAY,
			withTiming( 1, BLOCK_OPACITY_ANIMATION_CONFIG )
		);
	};

	const { isDraggable, isBeingDragged, canDragBlock } = useSelect(
		( select ) => {
			const {
				getBlockRootClientId,
				getTemplateLock,
				isBlockBeingDragged,
				hasSelectedBlock,
			} = select( blockEditorStore );
			const rootClientId = getBlockRootClientId( clientId );
			const templateLock = rootClientId
				? getTemplateLock( rootClientId )
				: null;
			const isAnyTextInputFocused =
				TextInputState.currentlyFocusedInput() !== null;

			return {
				isBeingDragged: isBlockBeingDragged( clientId ),
				isDraggable: 'all' !== templateLock,
				canDragBlock: hasSelectedBlock()
					? ! isAnyTextInputFocused
					: true,
			};
		},
		[ clientId ]
	);

	useEffect( () => {
		if ( isBeingDragged !== wasBeingDragged.current ) {
			if ( isBeingDragged ) {
				startDraggingBlock();
			} else {
				stopDraggingBlock();
			}
		}
		wasBeingDragged.current = isBeingDragged;
	}, [ isBeingDragged ] );

	const animatedWrapperStyles = useAnimatedStyle( () => {
		return {
			opacity: draggingAnimation.opacity.value,
		};
	} );
	const wrapperStyles = [
		animatedWrapperStyles,
		styles[ 'draggable-wrapper__container' ],
	];

	if ( ! isDraggable ) {
		return children( { isDraggable: false } );
	}

	return (
		<DraggableTrigger
			id={ clientId }
			enabled={ enabled && canDragBlock }
			minDuration={ Platform.select( {
				// On iOS, using a lower min duration than the default
				// value prevents the long-press gesture from being
				// triggered in underneath elements. This is required to
				// prevent enabling text editing when dragging is available.
				ios: canDragBlock
					? DEFAULT_IOS_LONG_PRESS_MIN_DURATION
					: DEFAULT_LONG_PRESS_MIN_DURATION,
				android: DEFAULT_LONG_PRESS_MIN_DURATION,
			} ) }
		>
			<Animated.View style={ wrapperStyles }>
				{ children( { isDraggable: true } ) }
			</Animated.View>
		</DraggableTrigger>
	);
};

export { BlockDraggableWrapper };
export default BlockDraggable;
