/**
 * External dependencies
 */
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	useAnimatedReaction,
	runOnJS,
} from 'react-native-reanimated';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { useBlockListContext } from './block-list-context';
import styles from './dropping-insertion-point.scss';

/**
 * Dropping zone indicator component.
 *
 * This component shows where a block can be dropped when it's being dragged.
 *
 * @param {Object}                                        props                        Component props.
 * @param {Object}                                        props.scroll                 Scroll offset object.
 * @param {import('react-native-reanimated').SharedValue} props.hasStartedDraggingOver Whether or not the block has started moving.
 * @param {import('react-native-reanimated').SharedValue} props.targetBlockIndex       Current block target index.
 *
 * @return {JSX.Element} The component to be rendered.
 */
export default function DroppingInsertionPoint( {
	scroll,
	hasStartedDraggingOver,
	targetBlockIndex,
} ) {
	const {
		getBlockOrder,
		isBlockBeingDragged,
		isDraggingBlocks,
		getPreviousBlockClientId,
		getNextBlockClientId,
	} = useSelect( blockEditorStore );

	const { blocksLayouts, findBlockLayoutByClientId } = useBlockListContext();

	const blockYPosition = useSharedValue( 0 );
	const opacity = useSharedValue( 0 );

	useAnimatedReaction(
		() => hasStartedDraggingOver.value,
		( value ) => {
			if ( ! value ) {
				opacity.value = 0;
				blockYPosition.value = 0;
			}
		}
	);

	const setIndicatorPosition = useCallback(
		( index ) => {
			const insertionPointIndex = index;
			const order = getBlockOrder();
			const isDraggingAnyBlocks = isDraggingBlocks();

			if (
				! isDraggingAnyBlocks ||
				insertionPointIndex === null ||
				! order.length
			) {
				return;
			}

			let previousClientId = order[ insertionPointIndex - 1 ];
			let nextClientId = order[ insertionPointIndex ];

			while ( isBlockBeingDragged( previousClientId ) ) {
				previousClientId = getPreviousBlockClientId( previousClientId );
			}

			while ( isBlockBeingDragged( nextClientId ) ) {
				nextClientId = getNextBlockClientId( nextClientId );
			}

			const previousElement = previousClientId
				? findBlockLayoutByClientId(
						blocksLayouts.current,
						previousClientId
				  )
				: null;
			const nextElement = nextClientId
				? findBlockLayoutByClientId(
						blocksLayouts.current,
						nextClientId
				  )
				: null;

			const nextPosition = previousElement
				? previousElement.y + previousElement.height
				: nextElement?.y;

			if ( nextPosition && blockYPosition.value !== nextPosition ) {
				opacity.value = 0;
				blockYPosition.value = nextPosition;
				opacity.value = withTiming( 1 );
			}
		},
		[
			getBlockOrder,
			isBlockBeingDragged,
			isDraggingBlocks,
			getPreviousBlockClientId,
			getNextBlockClientId,
			findBlockLayoutByClientId,
			blocksLayouts,
		]
	);

	useAnimatedReaction(
		() => targetBlockIndex.value,
		( value ) => {
			runOnJS( setIndicatorPosition )( value );
		}
	);

	const insertionPointStyles = useAnimatedStyle( () => {
		return {
			...styles[ 'dropping-insertion-point' ],
			opacity: opacity.value,
			transform: [
				{ translateX: 0 },
				{
					translateY: blockYPosition.value - scroll.offsetY.value,
				},
			],
		};
	} );

	return (
		<Animated.View pointerEvents="none" style={ insertionPointStyles } />
	);
}
