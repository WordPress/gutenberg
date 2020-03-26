/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';
import { cleanForSlug } from '@wordpress/editor';

export function linearToNestedHeadingList( headingsList, index = 0 ) {
	const nestedHeadingsList = [];

	headingsList.forEach( function( heading, key ) {
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

export function getPageHeadings() {
	return convertHeadingBlocksToAttributes( getHeadingBlocks() );
}

export function getHeadingBlocks() {
	const editor = select( 'core/block-editor' );
	return editor
		.getBlocks()
		.filter( ( block ) => block.name === 'core/heading' );
}

export function convertHeadingBlocksToAttributes( headingBlocks ) {
	return headingBlocks.map( function( heading ) {
		const level = heading.attributes.level.toString();

		const headingContent = heading.attributes.content || '';
		const anchorContent = heading.attributes.anchor || '';

		// strip html from heading and attribute content
		const contentDiv = document.createElement( 'div' );

		contentDiv.innerHTML = headingContent;
		const content = contentDiv.textContent || contentDiv.innerText || '';

		contentDiv.innerHTML = anchorContent;
		let anchor = contentDiv.textContent || contentDiv.innerText || '';

		if ( anchor !== '' && ! anchor.includes( '#' ) ) {
			anchor = '#' + cleanForSlug( anchor );
		}

		return { content, anchor, level };
	} );
}

export function updateHeadingBlockAnchors() {
	// Add anchors to any headings that don't have one.
	getHeadingBlocks().forEach( function( heading, key ) {
		const headingAnchorEmpty =
			heading.attributes.anchor === undefined ||
			heading.attributes.anchor === '';
		const headingContentEmpty =
			heading.attributes.content === undefined ||
			heading.attributes.content === '';
		const headingDefaultAnchor =
			! headingAnchorEmpty &&
			heading.attributes.anchor.indexOf( key + '-' ) === 0;

		if (
			! headingContentEmpty &&
			( headingAnchorEmpty || headingDefaultAnchor )
		) {
			heading.attributes.anchor =
				key +
				'-' +
				cleanForSlug( heading.attributes.content.toString() );
		}
	} );
}

export function haveHeadingsChanged( oldHeadings, newHeadings ) {
	if ( oldHeadings.length !== newHeadings.length ) {
		return true;
	}

	const changedHeadings = oldHeadings.filter( ( heading, index ) => {
		const newHeading = newHeadings[ index ];

		return (
			heading.content !== newHeading.content ||
			heading.anchor !== newHeading.anchor ||
			heading.level !== newHeading.level
		);
	} );

	// Return boolean value from length.
	return !! +changedHeadings.length;
}
