/**
 * External dependencies
 */
import { isNil, deburr, trim } from 'lodash';

/**
 * WordPress dependencies
 */
import { cleanForSlug } from '@wordpress/url';

/**
 * Runs a callback over all blocks, including nested blocks.
 *
 * @param {Object[]} blocks   The blocks.
 * @param {Function} callback The callback.
 *
 * @return {void}
 */
const recurseOverBlocks = ( blocks, callback ) => {
	for ( const block of blocks ) {
		// eslint-disable-next-line callback-return
		callback( block );
		if ( block.innerBlocks ) {
			recurseOverBlocks( block.innerBlocks, callback );
		}
	}
};

/**
 * Returns the text without markup.
 *
 * @param {string} text The text.
 *
 * @return {string} The text without markup.
 */
const getTextWithoutMarkup = ( text ) => {
	const dummyElement = document.createElement( 'div' );
	dummyElement.innerHTML = text;
	return dummyElement.innerText;
};

/**
 * Get all heading anchors.
 *
 * @param {Object} blockList An object containing all blocks.
 * @param {string} excludeId A block ID we want to exclude.
 *
 * @return {string[]} Return an array of anchors.
 */
export const getAllHeadingAnchors = ( blockList, excludeId ) => {
	const anchors = [];

	recurseOverBlocks( blockList, ( block ) => {
		if (
			block.name === 'core/heading' &&
			( ! excludeId || block.clientId !== excludeId ) &&
			block.attributes.anchor
		) {
			anchors.push( block.attributes.anchor );
		}
	} );

	return anchors;
};

/**
 * Generate the anchor for a heading.
 *
 * @param {string}   anchor            The heading anchor.
 * @param {string}   content           The block content.
 * @param {string[]} allHeadingAnchors An array containing all headings anchors.
 *
 * @return {string} Return the heading anchor.
 */
const generateAnchor = ( anchor, content, allHeadingAnchors ) => {
	content = getTextWithoutMarkup( content );

	// Get the slug.
	let slug = cleanForSlug( content );
	// If slug is empty, then it's likely using non-latin characters.
	if ( '' === slug ) {
		slug = trim(
			deburr( content )
				.replace( /[\s\./]+/g, '-' )
				.toLowerCase(),
			'-'
		);
	}

	const baseAnchor = `wp-${ slug }`;
	anchor = baseAnchor;
	let i = 0;

	// If the anchor already exists in another heading, append -i.
	while ( allHeadingAnchors.includes( anchor ) ) {
		i += 1;
		anchor = baseAnchor + '-' + i;
	}

	return 'wp-' === anchor ? '' : anchor;
};

/**
 * Updates the anchor if required.
 *
 * @param {string}   anchor            The heading anchor.
 * @param {string}   content           The block content.
 * @param {string[]} allHeadingAnchors An array containing all headings anchors.
 *
 * @return {string} The anchor.
 */
export const maybeUpdateAnchor = ( anchor, content, allHeadingAnchors ) => {
	return isNil( anchor ) || anchor.startsWith( 'wp-' )
		? generateAnchor( anchor, content, allHeadingAnchors )
		: anchor;
};
