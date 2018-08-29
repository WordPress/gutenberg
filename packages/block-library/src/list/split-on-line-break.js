/**
 * External dependencies
 */
import { last } from 'lodash-es';

/**
 * WordPress dependencies
 */
import {
	children as childrenAPI,
	node as nodeAPI,
} from '@wordpress/blocks';

const { getChildrenArray } = childrenAPI;
const { isNodeOfType } = nodeAPI;

/**
 * Split the content of a paragraph on line breaks ('<br>') into sets of
 * content, each representing a list item.
 *
 * The term "content" refers to a rich-text description of block children.
 *
 * @see WPBlockChildren
 *
 * @param {WPBlockChildren} children Block children
 * @return {Array<WPBlockChildren>} Array of block children
 */
export default function splitOnLineBreak( children ) {
	return getChildrenArray( children ).reduce( ( acc, node, i ) => {
		// Skip if node is a line break
		if ( isNodeOfType( node, 'br' ) ) {
			return acc;
		}

		// If we've just skipped a line break, append the
		// next node as a new item.
		const prevFragment = i > 0 && children[ i - 1 ];
		if ( isNodeOfType( prevFragment, 'br' ) ) {
			return [ ...acc, [ node ] ];
		}

		// Otherwise, append node to last item.
		return [
			...acc.slice( 0, acc.length - 1 ),
			[ ...last( acc ), node ],
		];
	}, [ [] ] );
}
