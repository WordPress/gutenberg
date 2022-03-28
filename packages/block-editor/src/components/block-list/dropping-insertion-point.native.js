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
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { useBlockListContext } from './block-list-context';
import styles from './dropping-insertion-point.scss';

export default function DroppingInsertionPoint( {
	scroll,
	hasStartedDraggingOver,
} ) {
	const { previousClientId, nextClientId } = useSelect( ( select ) => {
		const {
			getBlockOrder,
			getBlockInsertionPoint,
			isBlockBeingDragged,
			getPreviousBlockClientId,
			getNextBlockClientId,
		} = select( blockEditorStore );
		const insertionPoint = getBlockInsertionPoint();
		const order = getBlockOrder( insertionPoint.rootClientId );

		if ( ! order.length ) {
			return {};
		}

		let _previousClientId = order[ insertionPoint.index - 1 ];
		let _nextClientId = order[ insertionPoint.index ];

		while ( isBlockBeingDragged( _previousClientId ) ) {
			_previousClientId = getPreviousBlockClientId( _previousClientId );
		}

		while ( isBlockBeingDragged( _nextClientId ) ) {
			_nextClientId = getNextBlockClientId( _nextClientId );
		}

		return {
			previousClientId: _previousClientId,
			nextClientId: _nextClientId,
		};
	}, [] );
	const [ hasStartedDragging, setHasStartedDragging ] = useState( false );

	const { blocksLayouts, findBlockLayoutByClientId } = useBlockListContext();

	const blockYPosition = useSharedValue( 0 );
	const opacity = useSharedValue( 0 );

	useAnimatedReaction(
		() => hasStartedDraggingOver.value,
		( value ) => {
			runOnJS( setHasStartedDragging )( value );
		}
	);

	useEffect( () => {
		const previousElement = findBlockLayoutByClientId(
			blocksLayouts.current,
			previousClientId
		);
		const nextElement = findBlockLayoutByClientId(
			blocksLayouts.current,
			nextClientId
		);

		if ( ! hasStartedDragging || ( previousElement && ! nextElement ) ) {
			blockYPosition.value = 0;
			opacity.value = withTiming( 0 );
		} else {
			const nextPosition = previousElement
				? previousElement.y + previousElement.height
				: nextElement.y;
			if ( blockYPosition.value !== nextPosition ) {
				opacity.value = 0;
				blockYPosition.value = nextPosition;
				opacity.value = withTiming( 1 );
			}
		}
	}, [ previousClientId, nextClientId, blocksLayouts.current ] );

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
