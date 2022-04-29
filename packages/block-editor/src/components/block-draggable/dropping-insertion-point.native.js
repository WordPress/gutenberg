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
import {
	useSafeAreaInsets,
	useSafeAreaFrame,
} from 'react-native-safe-area-context';

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
 * @param {Object}                                        props.currentYPosition Current Y coordinate position when dragging.
 * @param {import('react-native-reanimated').SharedValue} props.isDragging       Whether or not dragging has started.
 * @param {import('react-native-reanimated').SharedValue} props.targetBlockIndex Current block target index.
 *
 * @return {JSX.Element} The component to be rendered.
 */
export default function DroppingInsertionPoint( {
	scroll,
	currentYPosition,
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
	const { top, bottom } = useSafeAreaInsets();
	const { height } = useSafeAreaFrame();
	const safeAreaOffset = top + bottom;
	const maxHeight =
		height -
		( safeAreaOffset + styles[ 'dropping-insertion-point' ].height );

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

	function getSelectedBlockIndicatorPosition( positions ) {
		const currentYPositionWithScroll =
			currentYPosition.value + scroll.offsetY.value;
		const midpoint = ( positions.top + positions.bottom ) / 2;

		return midpoint < currentYPositionWithScroll
			? positions.bottom
			: positions.top;
	}

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

		const previousElementPosition = previousElement
			? previousElement.y + previousElement.height
			: 0;
		const nextElementPosition = nextElement ? nextElement.y : 0;

		const elementsPositions = {
			top: Math.floor(
				previousElement ? previousElementPosition : nextElementPosition
			),
			bottom: Math.floor(
				nextElement ? nextElementPosition : previousElementPosition
			),
		};

		const nextPosition =
			elementsPositions.top !== elementsPositions.bottom
				? getSelectedBlockIndicatorPosition( elementsPositions )
				: elementsPositions.top;

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
		const translationY = blockYPosition.value - scroll.offsetY.value;
		// Prevents overflowing behind the header/footer
		const shouldHideIndicator =
			translationY < 0 || translationY > maxHeight;

		return {
			opacity: shouldHideIndicator ? 0 : opacity.value,
			transform: [
				{
					translateY: translationY,
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
