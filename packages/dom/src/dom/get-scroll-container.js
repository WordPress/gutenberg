/**
 * Internal dependencies
 */
import getComputedStyle from './get-computed-style';

/**
 * Given a DOM node, finds the closest scrollable container node or the node
 * itself, if scrollable.
 *
 * @param {Element | null} node      Node from which to start.
 * @param {?string}        direction Direction of scrollable container to search for ('vertical', 'horizontal', 'all').
 *                                   Defaults to 'vertical'.
 * @return {Element | undefined} Scrollable container node, if found.
 */
export default function getScrollContainer( node, direction = 'vertical' ) {
	if ( ! node ) {
		return undefined;
	}

	if ( direction === 'vertical' || direction === 'all' ) {
		// Scrollable if scrollable height exceeds displayed...
		if ( node.scrollHeight > node.clientHeight ) {
			// ...except when overflow is defined to be hidden or visible
			const { overflowY } = getComputedStyle( node );

			if ( /(auto|scroll)/.test( overflowY ) ) {
				return node;
			}
		}
	}

	if ( direction === 'horizontal' || direction === 'all' ) {
		// Scrollable if scrollable width exceeds displayed...
		if ( node.scrollWidth > node.clientWidth ) {
			// ...except when overflow is defined to be hidden or visible
			const { overflowX } = getComputedStyle( node );

			if ( /(auto|scroll)/.test( overflowX ) ) {
				return node;
			}
		}
	}

	if ( node.ownerDocument === node.parentNode ) {
		return node;
	}

	// Continue traversing.
	return getScrollContainer(
		/** @type {Element} */ ( node.parentNode ),
		direction
	);
}
