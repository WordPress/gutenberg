/**
 * WordPress dependencies
 */
import { dispatch, select, subscribe } from '@wordpress/data';
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
function recurseOverBlocks( blocks, callback ) {
	for ( const block of blocks ) {
		// eslint-disable-next-line callback-return
		callback( block );
		if ( block.innerBlocks ) {
			recurseOverBlocks( block.innerBlocks, callback );
		}
	}
}

/**
 * Returns the text without markup.
 *
 * @param {string} text The text.
 *
 * @return {string} The text without markup.
 */
function getTextWithoutMarkup( text ) {
	dummyElement.innerHTML = text;
	return dummyElement.innerText;
}

/**
 * Generates an anchor.
 *
 * @param {Object}   block                     The block.
 * @param {string[]} knownAnchors              The known anchors.
 * @param {string[]} blocksThatWereNotHeadings The block client IDs that weren't headings in the previous state.
 * @param {boolean}  fillAllAnchors            Whether or not all empty anchors should be filled.
 *
 * @return {string} The anchor.
 */
function generateAnchor(
	block,
	knownAnchors,
	blocksThatWereNotHeadings,
	fillAllAnchors
) {
	// Gutenberg doesn't save empty strings.
	// So when anchor isn't set for a heading that already has content set an empty string.
	// However, if none of the headings have anchors, assume the page was old, and give all headings an anchor.
	if (
		! block.attributes.anchor &&
		! fillAllAnchors &&
		'' !== block.attributes.content.trim() &&
		! blocksThatWereNotHeadings.includes( block.clientId )
	) {
		return '';
	}

	// Get the slug.
	let slug = cleanForSlug( block.attributes.content );
	// If slug is empty, then it's likely using non-latin characters.
	if ( '' === slug ) {
		slug = block.attributes.content
			.trim()
			.replace( /[\s\./]+/g, '-' )
			.toLowerCase();
	}

	const baseAnchor = `wp-${ slug }`;
	let anchor = baseAnchor;
	let i = 0;

	while ( knownAnchors.includes( anchor ) ) {
		i += 1;
		anchor = baseAnchor + '-' + i;
	}

	return anchor;
}

/**
 * Updates the anchor if required.
 *
 * @param {Object}   block                     The block.
 * @param {Object}   knownHeadings             The known headings.
 * @param {string[]} knownAnchors              The known anchors.
 * @param {string[]} blocksThatWereNotHeadings The block client IDs that weren't headings in the previous state.
 * @param {boolean}  fillAllAnchors            Whether or not all empty anchors should be filled.
 *
 * @return {string} The anchor.
 */
function maybeUpdateAnchor(
	block,
	knownHeadings,
	knownAnchors,
	blocksThatWereNotHeadings,
	fillAllAnchors
) {
	let anchor = block.attributes.anchor;

	// If the block was previously unknown or has changed content
	// and the anchor is empty or was auto-generated.
	if (
		( ! knownHeadings[ block.clientId ] ||
			knownHeadings[ block.clientId ].content !==
				block.attributes.content ) &&
		( ! anchor || anchor.startsWith( 'wp-' ) )
	) {
		anchor = generateAnchor(
			block,
			knownAnchors,
			blocksThatWereNotHeadings,
			fillAllAnchors
		);

		if ( anchor !== block.attributes.anchor ) {
			dispatch(
				'core/block-editor'
			).updateBlockAttributes( block.clientId, { anchor } );
		}
	}

	return anchor;
}

/**
 * Subscribes to the store to update blocks as they are added or suggestions are updated.
 *
 * @return {void}
 */
export default function subscribeToStore() {
	let blockList = null;
	let updatingHeadings = false;
	let blocksThatWereNotHeadings = [];
	const knownHeadings = {};

	subscribe( () => {
		if ( updatingHeadings ) {
			return;
		}

		const updatedBlockList = select( 'core/block-editor' ).getBlocks();
		const knownAnchors = [];

		// If there have been any change in the blocks.
		if ( blockList !== updatedBlockList ) {
			const headings = [];
			const blocksThatAreNotHeadings = [];
			updatingHeadings = true;

			/**
			 * Loop over all blocks and test whether all headings don't have anchors.
			 * If so, assume this is an older page.
			 */
			const headingAnchors = [];
			recurseOverBlocks( updatedBlockList, ( block ) => {
				if ( block.name === 'core/heading' ) {
					headingAnchors.push( block.attributes.anchor );
				}
			} );

			// If all heading anchors are undefined, they should be populated.
			const fillAllAnchors = headingAnchors.every(
				( anchor ) => undefined === anchor
			);

			// First loop over all core/heading blocks, give them anchors if necessary and collect all anchors.
			recurseOverBlocks( updatedBlockList, ( block ) => {
				if ( block.name === 'core/heading' ) {
					const heading = block.attributes;
					const content = getTextWithoutMarkup( heading.content );
					const anchor = maybeUpdateAnchor(
						block,
						knownHeadings,
						knownAnchors,
						blocksThatWereNotHeadings,
						fillAllAnchors
					);
					knownHeadings[ block.clientId ] = heading;

					// Empty strings shouldn't be added to the table of contents.
					if ( anchor === '' || '' === content.trim() ) {
						return;
					}

					knownAnchors.push( anchor );
					headings.push( {
						content,
						href: '#' + anchor,
						level: heading.level,
					} );
				} else {
					blocksThatAreNotHeadings.push( block.clientId );
				}
			} );

			updatingHeadings = false;
			blocksThatWereNotHeadings = blocksThatAreNotHeadings;
		}

		blockList = updatedBlockList;
	} );
}
