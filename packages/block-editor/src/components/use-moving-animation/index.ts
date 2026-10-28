import { Controller } from '@react-spring/web';
import {
	useContext,
	useLayoutEffect,
	useMemo,
	useRef,
} from '@wordpress/element';
import { getScrollContainer } from '@wordpress/dom';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import { BlockRefs } from '../provider/block-refs-provider';
import type { UseMovingAnimationOptions } from './types';

/**
 * If the block count exceeds the threshold, we disable the reordering animation
 * to avoid laginess.
 */
const BLOCK_ANIMATION_THRESHOLD = 200;

/**
 * How many blocks next to the visible ones a block list also animates, so a
 * block entering the viewport moves in with its neighbours.
 */
const MAX_OFFSCREEN_NEIGHBOURS = 10;

type Selectors = ReturnType< typeof useSelect< typeof blockEditorStore > >;

interface Snapshot {
	previous: { top: number; left: number };
	prevRect: DOMRect;
}

function getAbsolutePosition( element: HTMLElement ) {
	return {
		top: element.offsetTop,
		left: element.offsetLeft,
	};
}

function takeSnapshot( element: HTMLElement ): Snapshot {
	return {
		previous: getAbsolutePosition( element ),
		prevRect: element.getBoundingClientRect(),
	};
}

/**
 * Moves an element that was just rendered in its new position from its
 * previous position into place.
 *
 * The way this animation works is the following:
 *  - The element is rendered as if there was no animation.
 *  - Its position is used as the destination point for the animation.
 *  - It is restored to the previous position using a CSS transform, and then
 *    animated to the destination point.
 *
 * @param element            The element in its new position.
 * @param clientId           The client ID of the block to animate.
 * @param snapshot           The element's position before it moved.
 * @param selectors          The block editor selectors.
 * @param isAnimationAllowed Whether the caller allows the animation.
 *
 * @return A function stopping the animation, if it started.
 */
function startMovingAnimation(
	element: HTMLElement,
	clientId: string,
	snapshot: Snapshot,
	selectors: Selectors,
	isAnimationAllowed: boolean
) {
	const { previous, prevRect } = snapshot;
	const {
		isTyping,
		isBlockSelected,
		isFirstMultiSelectedBlock,
		isBlockMultiSelected,
		isAncestorMultiSelected,
		isDraggingBlocks,
	} = selectors;
	// A block rendered in the canvas has a scroll container.
	const scrollContainer = getScrollContainer( element )!;
	const isSelected = isBlockSelected( clientId );
	const adjustScrolling = isSelected || isFirstMultiSelectedBlock( clientId );
	const isDragging = isDraggingBlocks();

	function preserveScrollPosition() {
		// The user already scrolled when dragging blocks.
		if ( isDragging ) {
			return;
		}

		if ( adjustScrolling && prevRect ) {
			const blockRect = element.getBoundingClientRect();
			const diff = blockRect.top - prevRect.top;

			if ( diff ) {
				scrollContainer.scrollTop += diff;
			}
		}
	}

	// We disable the animation if the user has a preference for reduced
	// motion, or if the user is typing (insertion by Enter).
	const disableAnimation =
		window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches ||
		isTyping() ||
		! isAnimationAllowed;

	if ( disableAnimation ) {
		// If the animation is disabled and the scroll needs to be adjusted,
		// just move directly to the final scroll position.
		preserveScrollPosition();
		return;
	}

	const isPartOfSelection =
		isSelected ||
		isBlockMultiSelected( clientId ) ||
		isAncestorMultiSelected( clientId );

	// The user already dragged the blocks to the new position, so don't
	// animate the dragged blocks.
	if ( isPartOfSelection && isDragging ) {
		return;
	}

	// Assigning `undefined` is ignored and keeps the transform.
	element.style.transform = undefined as unknown as string;
	const destination = getAbsolutePosition( element );

	const x = Math.round( previous.left - destination.left );
	const y = Math.round( previous.top - destination.top );

	// Nothing moved, e.g. the order changed after the element.
	if ( ! x && ! y ) {
		return;
	}

	// Make sure the other blocks move under the selected block(s). This has to
	// clear the in-block UI of the blocks being moved past (z-index 1 and 2),
	// which a plain `1` ties with and loses to on DOM order. Matches
	// `.block-editor-block-list__block.is-selected`.
	const zIndex = isPartOfSelection ? '20' : '';

	const controller = new Controller( {
		x: 0,
		y: 0,
		config: { mass: 5, tension: 2000, friction: 200 },
		onChange( { value } ) {
			let { x: valueX, y: valueY } = value;
			valueX = Math.round( valueX );
			valueY = Math.round( valueY );
			const finishedMoving = valueX === 0 && valueY === 0;
			element.style.transformOrigin = 'center center';
			// Set to `null` to explicitly remove the transform.
			element.style.transform = finishedMoving
				? ( null as unknown as string )
				: `translate3d(${ valueX }px,${ valueY }px,0)`;
			// Only needed while moving. Left behind, it makes the block a
			// stacking context and clamps overflowing UI inside it, e.g. a
			// Navigation submenu flyout renders behind its siblings.
			// `null` removes the property.
			element.style.zIndex = finishedMoving
				? ( null as unknown as string )
				: zIndex;
			preserveScrollPosition();
		},
	} );

	controller.start( { x: 0, y: 0, from: { x, y } } );

	return () => {
		controller.stop();
		controller.set( { x: 0, y: 0 } );
	};
}

/**
 * Hook used to move an element into its new position.
 *
 * @param $1                          Options
 * @param $1.triggerAnimationOnChange Variable used to trigger the animation if it changes.
 * @param $1.clientId                 The client ID of the block to animate.
 */
function useMovingAnimation( {
	triggerAnimationOnChange,
	clientId,
}: UseMovingAnimationOptions ) {
	const ref = useRef< HTMLElement | null | undefined >( undefined );
	const selectors = useSelect( blockEditorStore );

	// Whenever the trigger changes, we need to take a snapshot of the current
	// position of the element to use it as a starting point for the animation.
	const snapshot = useMemo(
		() => ref.current && takeSnapshot( ref.current ),
		[ triggerAnimationOnChange ]
	);

	useLayoutEffect( () => {
		if ( ! snapshot || ! ref.current ) {
			return;
		}

		return startMovingAnimation(
			ref.current,
			clientId,
			snapshot,
			selectors,
			selectors.getGlobalBlockCount() <= BLOCK_ANIMATION_THRESHOLD
		);
	}, [ snapshot, clientId, selectors ] );

	return ref;
}

/**
 * Moves the blocks of a block list into place when their order changes.
 *
 * The list takes care of this instead of each block, so a block does not
 * have to re-render when its index changes. Only the blocks the user can see
 * are animated, which keeps the animation cheap in long posts.
 *
 * @param order        The client IDs of the blocks in the list.
 * @param rootClientId The client ID of the block list's parent.
 */
export function useBlockListMovingAnimation(
	order: string[],
	rootClientId: string | null | undefined
) {
	const { refsMap } = useContext( BlockRefs );
	const selectors = useSelect( blockEditorStore );
	const previousOrderRef = useRef< string[] | undefined >( undefined );

	// Before the new order is committed, take a snapshot of the positions of
	// the blocks that may be visible to use them as starting points.
	const snapshots = useMemo( () => {
		const prevOrder = previousOrderRef.current;

		if ( ! prevOrder || prevOrder === order ) {
			return;
		}

		const {
			__unstableGetVisibleBlocks,
			getBlockRootClientId,
			getSelectedBlockClientId,
			getFirstMultiSelectedBlockClientId,
		} = selectors;
		const visibleBlocks = __unstableGetVisibleBlocks();
		// Blocks next to the visible ones may move into view, as many as
		// were removed.
		const neighbours = Math.min(
			MAX_OFFSCREEN_NEIGHBOURS,
			Math.max( 1, Math.abs( order.length - prevOrder.length ) )
		);
		const clientIds = new Set< string >();

		prevOrder.forEach( ( clientId, index ) => {
			if ( ! visibleBlocks.has( clientId ) ) {
				return;
			}

			const end = Math.min( prevOrder.length - 1, index + neighbours );
			for ( let i = Math.max( 0, index - neighbours ); i <= end; i++ ) {
				clientIds.add( prevOrder[ i ] );
			}
		} );

		// The scroll position follows the selected block, wherever it is.
		for ( const clientId of [
			getSelectedBlockClientId(),
			getFirstMultiSelectedBlockClientId(),
		] ) {
			if (
				clientId &&
				getBlockRootClientId( clientId ) === ( rootClientId ?? '' )
			) {
				clientIds.add( clientId );
			}
		}

		const result = new Map< string, Snapshot >();

		for ( const clientId of clientIds ) {
			const element = refsMap.get( clientId ) as HTMLElement | undefined;
			if ( element ) {
				result.set( clientId, takeSnapshot( element ) );
			}
		}

		return result;
	}, [ order, rootClientId, refsMap, selectors ] );

	useLayoutEffect( () => {
		previousOrderRef.current = order;
	}, [ order ] );

	useLayoutEffect( () => {
		if ( ! snapshots ) {
			return;
		}

		const stops: Array< () => void > = [];

		for ( const [ clientId, snapshot ] of snapshots ) {
			const element = refsMap.get( clientId ) as HTMLElement | undefined;

			// The block was removed.
			if ( ! element?.isConnected ) {
				continue;
			}

			const stop = startMovingAnimation(
				element,
				clientId,
				snapshot,
				selectors,
				true
			);

			if ( stop ) {
				stops.push( stop );
			}
		}

		return () => stops.forEach( ( stop ) => stop() );
	}, [ snapshots, refsMap, selectors ] );
}

export default useMovingAnimation;
