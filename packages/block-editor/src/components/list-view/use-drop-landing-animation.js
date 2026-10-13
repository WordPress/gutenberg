import { Controller } from '@react-spring/web';
import { getScrollContainer } from '@wordpress/dom';
import { useEffect, useLayoutEffect, useRef } from '@wordpress/element';
import { MOVING_ANIMATION_CONFIG } from '../use-moving-animation';
import { useListViewContext } from './context';
import { getDragChip } from './drag-chip';

/**
 * Returns whether any part of a rect is visible within the element's scroll
 * container.
 *
 * @param {Element} element The element the rect belongs to.
 * @param {DOMRect} rect    The rect to check.
 * @return {boolean} Whether the rect is visible.
 */
function isVisibleInScrollContainer( element, rect ) {
	const scrollContainer = getScrollContainer( element );
	const bounds = scrollContainer
		? scrollContainer.getBoundingClientRect()
		: { top: 0, bottom: element.ownerDocument.defaultView.innerHeight };
	return rect.bottom > bounds.top && rect.top < bounds.bottom;
}

/**
 * When a dragged row is dropped, slides a copy of the drag chip from where it
 * was dropped to the row's new position, and hides the row until it lands.
 *
 * The row can't be animated itself, because the list view's scroll container
 * would clip it. The copy is added next to the drag chip, outside the list
 * view, so it renders above everything else.
 *
 * @param {Object}  $1           Options.
 * @param {string}  $1.clientId  The client ID of the row.
 * @param {boolean} $1.isDragged Whether the row is being dragged.
 * @param {string}  $1.path      The row's position in the tree. The landing runs when it changes.
 * @return {Object} Ref to attach to the row.
 */
export default function useDropLandingAnimation( {
	clientId,
	isDragged,
	path,
} ) {
	const ref = useRef();
	const previousPathRef = useRef( path );
	const stopLandingRef = useRef();
	const { listViewInstanceId } = useListViewContext();

	useLayoutEffect( () => {
		const hasMoved = previousPathRef.current !== path;
		previousPathRef.current = path;

		const row = ref.current;
		if ( ! hasMoved || ! isDragged || ! row ) {
			return;
		}

		const { ownerDocument } = row;
		const chip = getDragChip( ownerDocument, listViewInstanceId, clientId );
		// `Draggable` moves the chip by translating this wrapper.
		const chipWrapper = chip?.parentElement;
		if (
			! chipWrapper?.parentElement ||
			ownerDocument.defaultView.matchMedia(
				'(prefers-reduced-motion: reduce)'
			).matches
		) {
			return;
		}

		const to = row.getBoundingClientRect();
		if ( ! isVisibleInScrollContainer( row, to ) ) {
			return;
		}
		const from = chip.getBoundingClientRect();

		// The drag chip is removed when the drag ends, so animate a copy.
		const landing = chipWrapper.cloneNode( true );
		landing.querySelector( '[id]' )?.removeAttribute( 'id' );
		chipWrapper.parentElement.appendChild( landing );
		row.style.visibility = 'hidden';

		const { transform } = chipWrapper.style;
		const controller = new Controller( {
			x: 0,
			y: 0,
			config: MOVING_ANIMATION_CONFIG,
			onChange( { value } ) {
				landing.style.transform = `${ transform } translate3d(${ value.x }px, ${ value.y }px, 0)`;
			},
			onRest: stopLanding,
		} );

		function stopLanding() {
			if ( stopLandingRef.current !== stopLanding ) {
				return;
			}
			stopLandingRef.current = undefined;
			controller.stop();
			landing.remove();
			row.style.visibility = '';
		}

		stopLandingRef.current?.();
		stopLandingRef.current = stopLanding;
		controller.start( { x: to.left - from.left, y: to.top - from.top } );
		// Not returning a cleanup: `isDragged` changes when the drag ends,
		// which is while the copy is still landing.
	}, [ clientId, isDragged, listViewInstanceId, path ] );

	useEffect( () => () => stopLandingRef.current?.(), [] );

	return ref;
}
