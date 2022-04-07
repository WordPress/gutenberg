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
import { generateHapticFeedback } from '@wordpress/react-native-bridge';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { useBlockListContext } from '../block-list/block-list-context';
import styles from './dropping-insertion-point.scss';

/**
 * Dropping zone indicator component.
 *
 * This component shows where a block can be dropped when it's being dragged.
 *
 * @param {Object}                                        props                  Component props.
 * @param {Object}                                        props.scroll           Scroll offset object.
 * @param {import('react-native-reanimated').SharedValue} props.isDragging       Whether or not dragging has started.
 * @param {import('react-native-reanimated').SharedValue} props.targetBlockIndex Current block target index.
 *
 * @return {JSX.Element} The component to be rendered.
 */
export default function DroppingInsertionPoint( {
	scroll,
	isDragging,
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
		() => isDragging.value,
		( value ) => {
			if ( ! value ) {
				opacity.value = 0;
				blockYPosition.value = 0;
			}
		}
	);

	function setIndicatorPosition( index ) {
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
			? findBlockLayoutByClientId( blocksLayouts.current, nextClientId )
			: null;

		const nextPosition = previousElement
			? previousElement.y + previousElement.height
			: nextElement?.y;

		if ( nextPosition && blockYPosition.value !== nextPosition ) {
			opacity.value = 0;
			blockYPosition.value = nextPosition;
			opacity.value = withTiming( 1 );
			generateHapticFeedback();
		}
	}

	useAnimatedReaction(
		() => targetBlockIndex.value,
		( value, previous ) => {
			if ( value !== previous ) {
				runOnJS( setIndicatorPosition )( value );
			}
		}
	);

	const animatedStyles = useAnimatedStyle( () => {
		return {
			opacity: opacity.value,
			transform: [
				{
					translateY: blockYPosition.value - scroll.offsetY.value,
				},
			],
		};
	} );

	const insertionPointStyles = [
		styles[ 'dropping-insertion-point' ],
		animatedStyles,
	];

	return (
		<Animated.View pointerEvents="none" style={ insertionPointStyles } />
	);
}
