/**
 * External dependencies
 */
import { last } from 'lodash';

/**
 * Split the content of a paragraph on line breaks ('<br>') into sets of
 * content, each representing a list item.
 *
 * The term "content" refers to a rich-text description in the form of a mixed
 * array of strings and element-like objects (e.g. `{ type: strong, props: {
 * children: […] } }`).
 *
 * @param {WPBlockChildren} fragments Rich-text content
 * @return {Array<WPBlockChildren>} Array of rich-text content
 */
export default function splitOnLineBreak( fragments ) {
	return fragments.reduce( ( acc, fragment, i, arr ) => {
		// Skip if fragment is a line break
		if ( fragment && fragment.type === 'br' ) {
			return acc;
		}

		// If we've just skipped a line break, append the
		// next fragment as a new item.
		const prevFragment = i > 0 && arr[ i - 1 ];
		if ( prevFragment && prevFragment.type === 'br' ) {
			return [ ...acc, [ fragment ] ];
		}

		// Otherwise, append fragment to last item.
		return [
			...acc.slice( 0, acc.length - 1 ),
			[ ...last( acc ), fragment ],
		];
	}, [ [] ] );
}
