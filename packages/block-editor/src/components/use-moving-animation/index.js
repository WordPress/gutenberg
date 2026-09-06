import { Controller } from '@react-spring/web';
import { useLayoutEffect, useMemo, useRef } from '@wordpress/element';
import { getScrollContainer } from '@wordpress/dom';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';

/**
 * If the block count exceeds the threshold, we disable the reordering animation
 * to avoid laginess.
 */
const BLOCK_ANIMATION_THRESHOLD = 200;

function getAbsolutePosition( element ) {
	return {
		top: element.offsetTop,
		left: element.offsetLeft,
	};
}

/**
 * Hook used to compute the styles required to move a div into a new position.
 *
 * The way this animation works is the following:
 *  - It first renders the element as if there was no animation.
 *  - It takes a snapshot of the position of the block to use it
 *    as a destination point for the animation.
 *  - It restores the element to the previous position using a CSS transform
 *  - It uses the "resetAnimation" flag to reset the animation
 *    from the beginning in order to animate to the new destination point.
 *
 * @param {Object} $1                          Options
 * @param {*}      $1.triggerAnimationOnChange Variable used to trigger the animation if it changes.
 * @param {string} $1.clientId
 */
function useMovingAnimation( { triggerAnimationOnChange, clientId } ) {
	const ref = useRef();
	const {
		isTyping,
		getGlobalBlockCount,
		isBlockSelected,
		isFirstMultiSelectedBlock,
		isBlockMultiSelected,
		isAncestorMultiSelected,
		isDraggingBlocks,
	} = useSelect( blockEditorStore );

	// Whenever the trigger changes, we need to take a snapshot of the current
	// position of the block to use it as a destination point for the animation.
	const { previous, prevRect } = useMemo(
		() => ( {
			previous: ref.current && getAbsolutePosition( ref.current ),
			prevRect: ref.current && ref.current.getBoundingClientRect(),
		} ),
		[ triggerAnimationOnChange ]
	);

	useLayoutEffect( () => {
		if ( ! previous || ! ref.current ) {
			return;
		}

		const scrollContainer = getScrollContainer( ref.current );
		const isSelected = isBlockSelected( clientId );
		const adjustScrolling =
			isSelected || isFirstMultiSelectedBlock( clientId );
		const isDragging = isDraggingBlocks();

		function preserveScrollPosition() {
			// The user already scrolled when dragging blocks.
			if ( isDragging ) {
				return;
			}

			if ( adjustScrolling && prevRect ) {
				const blockRect = ref.current.getBoundingClientRect();
				const diff = blockRect.top - prevRect.top;

				if ( diff ) {
					scrollContainer.scrollTop += diff;
				}
			}
		}

		// We disable the animation if the user has a preference for reduced
		// motion, if the user is typing (insertion by Enter), or if the block
		// count exceeds the threshold (insertion caused all the blocks that
		// follow to animate).
		// To do: consider enabling the _moving_ animation even for large
		// posts, while only disabling the _insertion_ animation?
		const disableAnimation =
			window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches ||
			isTyping() ||
			getGlobalBlockCount() > BLOCK_ANIMATION_THRESHOLD;

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
				if ( ! ref.current ) {
					return;
				}
				let { x, y } = value;
				x = Math.round( x );
				y = Math.round( y );
				const finishedMoving = x === 0 && y === 0;
				ref.current.style.transformOrigin = 'center center';
				ref.current.style.transform = finishedMoving
					? null // Set to `null` to explicitly remove the transform.
					: `translate3d(${ x }px,${ y }px,0)`;
				// Only needed while moving. Left behind, it makes the block a
				// stacking context and clamps overflowing UI inside it, e.g. a
				// Navigation submenu flyout renders behind its siblings.
				ref.current.style.zIndex = finishedMoving ? null : zIndex;
				preserveScrollPosition();
			},
		} );

		ref.current.style.transform = undefined;
		const destination = getAbsolutePosition( ref.current );

		const x = Math.round( previous.left - destination.left );
		const y = Math.round( previous.top - destination.top );

		controller.start( { x: 0, y: 0, from: { x, y } } );

		return () => {
			controller.stop();
			controller.set( { x: 0, y: 0 } );
		};
	}, [
		previous,
		prevRect,
		clientId,
		isTyping,
		getGlobalBlockCount,
		isBlockSelected,
		isFirstMultiSelectedBlock,
		isBlockMultiSelected,
		isAncestorMultiSelected,
		isDraggingBlocks,
	] );

	return ref;
}

export default useMovingAnimation;
