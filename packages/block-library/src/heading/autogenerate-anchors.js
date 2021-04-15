/**
 * External dependencies
 */
import { isEmpty, isNil, deburr, trim } from 'lodash';

/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';
import { cleanForSlug } from '@wordpress/url';

// This dummy element is used to strip all markup in getTextWithoutMarkup below.
const dummyElement = document.createElement( 'div' );

/**
 * Runs a function over all blocks, including nested blocks.
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
	dummyElement.innerHTML = text;
	return dummyElement.innerText;
};

/**
 * Get all heading anchors.
 *
 * @param {string} excludeId A block ID we want to exclude.
 *
 * @return {string[]} Return an array of anchors.
 */
const getAllHeadingAnchors = ( excludeId ) => {
	const blockList = select( 'core/block-editor' ).getBlocks();
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

// Whether this is an old post and we need to generate all headings or not.
const noAnchorsExist = isEmpty( getAllHeadingAnchors() );

/**
 * Generate the anchor for a heading.
 *
 * @param {string}   anchor   The heading anchor.
 * @param {string}   content  The block content.
 * @param {clientId} clientId The block ID.
 *
 * @return {string} Return the heading anchor.
 */
const generateAnchor = ( anchor, content, clientId ) => {
	content = getTextWithoutMarkup( content );
	// When anchor isn't set for a heading that already has content set an empty string.
	if ( isNil( anchor ) && ! isEmpty( content ) ) {
		return '';
	}

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
	while ( getAllHeadingAnchors( clientId ).includes( anchor ) ) {
		i += 1;
		anchor = baseAnchor + '-' + i;
	}

	return anchor;
};

/**
 * Updates the anchor if required.
 *
 * @param {string}   anchor   The heading anchor.
 * @param {string}   content  The block content.
 * @param {clientId} clientId The block ID.
 *
 * @return {string} The anchor.
 */
export default function maybeUpdateAnchor( anchor, content, clientId ) {
	return noAnchorsExist || isNil( anchor ) || anchor.startsWith( 'wp-' )
		? generateAnchor( anchor, content, clientId )
		: anchor;
}
