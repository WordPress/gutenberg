/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import { escapeAttribute, escapeEditableHTML } from '@wordpress/escape-html';

export interface HeadingData {
	/** The plain text content of the heading. */
	content: string;
	/** The heading level. */
	level: number;
	/** Link to the heading. */
	link: string;
}

export interface NestedHeadingData {
	/** The heading content, level, and link. */
	heading: HeadingData;
	/** The sub-headings of this heading, if any. */
	children: NestedHeadingData[] | null;
}

/**
 * Takes a flat list of heading parameters and nests them based on each header's
 * immediate parent's level.
 *
 * @param headingList The flat list of headings to nest.
 *
 * @return The nested list of headings.
 */
export function linearToNestedHeadingList(
	headingList: HeadingData[]
): NestedHeadingData[] {
	const nestedHeadingList: NestedHeadingData[] = [];

	headingList.forEach( ( heading, key ) => {
		if ( heading.content === '' ) {
			return;
		}

		// Make sure we are only working with the same level as the first iteration in our set.
		if ( heading.level === headingList[ 0 ].level ) {
			// Check that the next iteration will return a value.
			// If it does and the next level is greater than the current level,
			// the next iteration becomes a child of the current iteration.
			if ( headingList[ key + 1 ]?.level > heading.level ) {
				// We must calculate the last index before the next iteration that
				// has the same level (siblings). We then use this index to slice
				// the array for use in recursion. This prevents duplicate nodes.
				let endOfSlice = headingList.length;
				for ( let i = key + 1; i < headingList.length; i++ ) {
					if ( headingList[ i ].level === heading.level ) {
						endOfSlice = i;
						break;
					}
				}

				// We found a child node: Push a new node onto the return array
				// with children.
				nestedHeadingList.push( {
					heading,
					children: linearToNestedHeadingList(
						headingList.slice( key + 1, endOfSlice )
					),
				} );
			} else {
				// No child node: Push a new node onto the return array.
				nestedHeadingList.push( {
					heading,
					children: null,
				} );
			}
		}
	} );

	return nestedHeadingList;
}

/**
 * Converts a nested heading list into `core/list-item` blocks, with
 * sub-headings nested in a `core/list` block inside their parent item.
 *
 * @param nestedHeadingList The nested list of headings.
 * @param ordered           Whether nested lists are ordered.
 *
 * @return The list item blocks.
 */
export function createListItemBlocks(
	nestedHeadingList: NestedHeadingData[],
	ordered: boolean
): Block[] {
	return nestedHeadingList.map(
		( { heading: { content, link }, children } ) =>
			createBlock(
				'core/list-item',
				{
					// Headings are plain text, and links can carry query args on
					// paginated posts, so both need escaping to become markup.
					content: link
						? `<a href="${ escapeAttribute(
								link
						  ) }">${ escapeEditableHTML( content ) }</a>`
						: escapeEditableHTML( content ),
				},
				children?.length
					? [
							createBlock(
								'core/list',
								{ ordered },
								createListItemBlocks( children, ordered )
							),
					  ]
					: []
			)
	);
}
