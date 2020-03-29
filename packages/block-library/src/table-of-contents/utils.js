/**
 * WordPress dependencies
 */
import { create } from '@wordpress/rich-text';

/**
 * Takes a flat list of heading parameters and nests them based on each header's
 * immediate parent's level.
 *
 * @param {Array}  headingsList The flat list of headings to nest.
 * @param {number} index        The current list index.
 * @return {Array} The nested list of headings.
 */
export function linearToNestedHeadingList( headingsList, index = 0 ) {
	const nestedHeadingsList = [];

	headingsList.forEach( ( heading, key ) => {
		if ( heading.content === undefined ) {
			return;
		}

		// Make sure we are only working with the same level as the first iteration in our set.
		if ( heading.level === headingsList[ 0 ].level ) {
			// Check that the next iteration will return a value.
			// If it does and the next level is greater than the current level,
			// the next iteration becomes a child of the current interation.
			if (
				headingsList[ key + 1 ] !== undefined &&
				headingsList[ key + 1 ].level > heading.level
			) {
				// We need to calculate the last index before the next iteration that has the same level (siblings).
				// We then use this last index to slice the array for use in recursion.
				// This prevents duplicate nodes.
				let endOfSlice = headingsList.length;
				for ( let i = key + 1; i < headingsList.length; i++ ) {
					if ( headingsList[ i ].level === heading.level ) {
						endOfSlice = i;
						break;
					}
				}

				// We found a child node: Push a new node onto the return array with children.
				nestedHeadingsList.push( {
					block: heading,
					index: index + key,
					children: linearToNestedHeadingList(
						headingsList.slice( key + 1, endOfSlice ),
						index + key + 1
					),
				} );
			} else {
				// No child node: Push a new node onto the return array.
				nestedHeadingsList.push( {
					block: heading,
					index: index + key,
					children: null,
				} );
			}
		}
	} );

	return nestedHeadingsList;
}

/**
 * Extracts text, anchor and level from a list of heading blocks.
 *
 * @param {Array} headingBlocks The list of heading blocks.
 * @return {Array} The list of heading parameters.
 */
export function convertBlocksToTableOfContents( headingBlocks ) {
	return headingBlocks.map( ( heading ) => {
		// This is a string so that it can be stored/sourced as an attribute in the table of contents
		// block using a data attribute.
		const level = heading.attributes.level.toString();

		const headingContent = heading.attributes.content;
		const anchorContent = heading.attributes.anchor;

		// Strip html from heading to use as the table of contents entry.
		const content = headingContent
			? create( { html: headingContent } ).text
			: '';

		const anchor = anchorContent ? `#${ anchorContent }` : '';

		return { content, anchor, level };
	} );
}
