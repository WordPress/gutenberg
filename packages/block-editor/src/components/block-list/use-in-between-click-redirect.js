/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { placeCaretAtVerticalEdge, focus } from '@wordpress/dom';

/**
 * Checks if the coordinates are within a given DOM rectangle.
 *
 * @param {DOMRect} rect Rectangle to check.
 * @param {number}  x    X coordinate to check.
 * @param {number}  y    Y coordinate to check.
 *
 * @return {boolean} True if within rectangle, false if not.
 */
function isWithinRect( rect, x, y ) {
	return x > rect.left && x < rect.right && y > rect.top && y < rect.bottom;
}

/**
 * Checks if the coordinates are within the given document's viewport.
 *
 * @param {Document} doc Document to check the viewport.
 * @param {number}   x   X coordinate to check.
 * @param {number}   y   Y coordinate to check.
 *
 * @return {boolean} True if within the document's viewport, false if not.
 */
function isWithinViewport( doc, x, y ) {
	const { defaultView } = doc;
	return (
		x > 0 &&
		x < defaultView.innerWidth &&
		y > 0 &&
		y < defaultView.innerHeight
	);
}

/**
 * Gets the closest descendent element from a given point in a given direction.
 * The given direction vector will be multiplied with an increasing offset until
 * a descendent is found or until the target element or viewport boundary is
 * reached.
 *
 * @param {HTMLElement} target Target element to check within.
 * @param {number}      x      X coordinate to check.
 * @param {number}      y      Y coordinate to check.
 * @param {Array}       vector Direction vector.
 *
 * @return {HTMLElement|undefined} The closest descendent element if found.
 */
function getClosestDescendentElementFromPointInDirection(
	target,
	x,
	y,
	vector
) {
	const rect = target.getBoundingClientRect();
	let offset = 0;

	while ( ++offset ) {
		const _x = x + offset * vector[ 0 ];
		const _y = y + offset * vector[ 1 ];
		const { ownerDocument } = target;

		if (
			! isWithinRect( rect, _x, _y ) ||
			! isWithinViewport( ownerDocument, _x, _y )
		) {
			return;
		}

		const element = ownerDocument.elementFromPoint( _x, _y );

		if ( element !== target && target.contains( element ) ) {
			return [ element, offset ];
		}
	}
}

/**
 * Gets the closest descendent element from a given point. Only returns a
 * descendent if descendents are found in more than one direction (so that the
 * point falls in-between descendents).
 *
 * @param {HTMLElement} target Target element to check within.
 * @param {number}      x      X coordinate to check.
 * @param {number}      y      Y coordinate to check.
 *
 * @return {HTMLElement|undefined} The closest descendent element if the point
 *                                 is found to be in-between descendents.
 */
function getClosestInBetweenDescendentElementFromPoint( target, x, y ) {
	const directions = [
		[ 1, 0 ],
		[ 0, 1 ],
		[ -1, 0 ],
		[ 0, -1 ],
	];

	let count = 0;
	let closestOffset;
	let closestElement;

	for ( const direction of directions ) {
		const result = getClosestDescendentElementFromPointInDirection(
			target,
			x,
			y,
			direction
		);

		if ( ! result ) {
			continue;
		}

		const [ element, offset ] = result;

		count++;

		if ( ! closestOffset || offset < closestOffset ) {
			closestOffset = offset;
			closestElement = element;
		}
	}

	if ( count < 2 ) {
		return;
	}

	return closestElement;
}

/**
 * Behavioural hook that redirects clicks on the element to the closest
 * focusable element so that there are no "dead zones" and so that small
 * focusable elements are easier to focus. The redirect only happens if the
 * click happens in-between two child elements.
 *
 * @return {Function} Ref callback.
 */
export function useInBetweenClickRedirect() {
	return useRefEffect( ( node ) => {
		function onMouseMove( event ) {
			const { clientX, clientY, target } = event;

			// Don't consider if the container element is not clicked directly.
			if ( target !== node ) {
				return;
			}

			const closestElement = getClosestInBetweenDescendentElementFromPoint(
				target,
				clientX,
				clientY
			);

			if ( ! closestElement ) {
				return;
			}

			const closestFocusableElement = closestElement.closest(
				focus.focusable.__unstableBuildSelector()
			);
			const isReverse =
				closestFocusableElement.getBoundingClientRect().bottom <
				clientY;
			const carectRect = new window.DOMRect( clientX, clientY, 0, 16 );

			placeCaretAtVerticalEdge(
				closestFocusableElement,
				isReverse,
				carectRect
			);
		}

		node.addEventListener( 'click', onMouseMove );

		return () => {
			node.removeEventListener( 'click', onMouseMove );
		};
	}, [] );
}
