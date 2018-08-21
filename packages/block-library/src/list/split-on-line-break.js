/**
 * External dependencies
 */
import { last } from 'lodash';

/**
 * WordPress dependencies
 */
import { children as childrenApi } from '@wordpress/blocks';

const { getChildrenArray, isChildOfType } = childrenApi;

/**
 * Split the content of a paragraph on line breaks ('<br>') into sets of
 * content, each representing a list item.
 *
 * The term "content" refers to a rich-text description of block children.
 *
 * @see WPBlockChildren
 *
 * @param {WPBlockChildren} children Rich-text content
 * @return {Array<WPBlockChildren>} Array of rich-text content
 */
export default function splitOnLineBreak( children ) {
	return getChildrenArray( children ).reduce( ( acc, child, i ) => {
		// Skip if child is a line break
		if ( isChildOfType( child, 'br' ) ) {
			return acc;
		}

		// If we've just skipped a line break, append the
		// next child as a new item.
		const prevFragment = i > 0 && children[ i - 1 ];
		if ( isChildOfType( prevFragment, 'br' ) ) {
			return [ ...acc, [ child ] ];
		}

		// Otherwise, append child to last item.
		return [
			...acc.slice( 0, acc.length - 1 ),
			[ ...last( acc ), child ],
		];
	}, [ [] ] );
}
