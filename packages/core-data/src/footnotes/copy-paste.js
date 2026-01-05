/**
 * WordPress dependencies
 */
import { RichTextData } from '@wordpress/rich-text';
import { v4 as createId } from 'uuid';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import findFootnotesBlock from './find-footnotes-block';
import getRichTextValuesCached from './get-rich-text-values-cached';

/**
 * Extracts footnote IDs from blocks recursively.
 *
 * @param {Array} blocks The blocks to extract footnote IDs from.
 * @return {Array} Array of unique footnote IDs found in the blocks.
 */
function extractFootnoteIdsFromBlocks( blocks ) {
	const footnoteIds = new Set();

	function extractFromBlock( block ) {
		// Extract from RichText values in block attributes
		for ( const value of getRichTextValuesCached( block ) ) {
			if ( ! value ) {
				continue;
			}
			value.replacements.forEach( ( replacement ) => {
				if ( replacement?.type === 'core/footnote' ) {
					footnoteIds.add( replacement.attributes[ 'data-fn' ] );
				}
			} );
		}

		// Recursively process inner blocks
		if ( block.innerBlocks ) {
			block.innerBlocks.forEach( extractFromBlock );
		}
	}

	blocks.forEach( extractFromBlock );
	return Array.from( footnoteIds );
}

/**
 * Extracts footnotes from a footnotes block that are referenced in the given blocks.
 *
 * @param {Array} blocks    The blocks that may contain footnotes.
 * @param {Array} allBlocks All blocks including the footnotes block.
 * @return {Array} Array of footnote objects that are referenced in the blocks.
 */
export function extractFootnotesForCopy( blocks, allBlocks ) {
	// Get footnote IDs referenced in the copied blocks
	const footnoteIds = extractFootnoteIdsFromBlocks( blocks );

	if ( footnoteIds.length === 0 ) {
		return [];
	}

	// Find the footnotes block in all blocks
	const footnotesBlock = findFootnotesBlock( allBlocks );

	if ( ! footnotesBlock?.attributes?.footnotes ) {
		return [];
	}

	// Extract only the footnotes that are referenced
	const footnotes = footnotesBlock.attributes.footnotes.filter( ( fn ) =>
		footnoteIds.includes( fn.id )
	);

	return footnotes;
}

/**
 * Merges copied footnotes into the destination footnotes block.
 * Creates new IDs for footnotes if there are conflicts.
 *
 * @param {Array} pastedBlocks      The blocks being pasted.
 * @param {Array} copiedFootnotes   The footnotes that were copied.
 * @param {Array} destinationBlocks All blocks in the destination, including footnotes block.
 * @return {Object} Object with updated blocks and ID mapping (oldId -> newId).
 */
export function mergeFootnotesOnPaste(
	pastedBlocks,
	copiedFootnotes,
	destinationBlocks
) {
	if ( copiedFootnotes.length === 0 ) {
		return { blocks: pastedBlocks, idMapping: {} };
	}

	// Deduplicate copied footnotes by ID to avoid processing duplicates
	const uniqueCopiedFootnotesMap = new Map();
	copiedFootnotes.forEach( ( fn ) => {
		if ( ! uniqueCopiedFootnotesMap.has( fn.id ) ) {
			uniqueCopiedFootnotesMap.set( fn.id, fn );
		}
	} );
	const uniqueCopiedFootnotes = Array.from(
		uniqueCopiedFootnotesMap.values()
	);

	// Find or create footnotes block in destination
	const footnotesBlock = findFootnotesBlock( destinationBlocks );
	const existingFootnotes = footnotesBlock?.attributes?.footnotes || [];

	// ALWAYS generate new IDs for ALL copied footnotes - no exceptions
	const idMapping = {};

	// Get all existing IDs to avoid conflicts
	const existingIds = new Set( existingFootnotes.map( ( fn ) => fn.id ) );

	// Generate a completely new ID for every single copied footnote
	uniqueCopiedFootnotes.forEach( ( fn ) => {
		let newId;
		// Keep generating until we get a unique ID
		do {
			newId = createId();
		} while ( existingIds.has( newId ) );

		// Map old ID to new ID
		idMapping[ fn.id ] = newId;
		// Track this new ID to avoid duplicates within the same paste batch
		existingIds.add( newId );
	} );

	// Update footnote IDs in pasted blocks
	function updateBlockIds( __blocks ) {
		return __blocks.map( ( block ) => {
			const updatedAttributes = updateAttributeIds( block.attributes );
			return {
				...block,
				attributes: updatedAttributes,
				innerBlocks: updateBlockIds( block.innerBlocks || [] ),
			};
		} );
	}

	function updateAttributeIds( attributes ) {
		if (
			! attributes ||
			Array.isArray( attributes ) ||
			typeof attributes !== 'object'
		) {
			return attributes;
		}

		attributes = { ...attributes };

		for ( const key in attributes ) {
			const value = attributes[ key ];

			if ( Array.isArray( value ) ) {
				attributes[ key ] = value.map( updateAttributeIds );
				continue;
			}

			if (
				typeof value !== 'string' &&
				! ( value instanceof RichTextData )
			) {
				continue;
			}

			const richTextValue =
				typeof value === 'string'
					? RichTextData.fromHTMLString( value )
					: new RichTextData( value );

			let hasChanges = false;

			richTextValue.replacements.forEach( ( replacement ) => {
				if ( replacement?.type === 'core/footnote' ) {
					const oldId = replacement.attributes[ 'data-fn' ];
					const newId = idMapping[ oldId ];

					if ( newId && newId !== oldId ) {
						// Update the footnote ID
						replacement.attributes[ 'data-fn' ] = newId;
						// Update the innerHTML to reflect new ID in the link
						const linkMatch =
							replacement.innerHTML.match( /href="#([^"]+)"/ );
						if ( linkMatch ) {
							replacement.innerHTML =
								replacement.innerHTML.replace(
									/href="#[^"]+"/,
									`href="#${ newId }"`
								);
							replacement.innerHTML =
								replacement.innerHTML.replace(
									/id="[^"]+-link"/,
									`id="${ newId }-link"`
								);
						}
						hasChanges = true;
					}
				}
			} );

			if ( hasChanges ) {
				attributes[ key ] =
					typeof value === 'string'
						? richTextValue.toHTMLString()
						: new RichTextData( richTextValue );
			}
		}

		return attributes;
	}

	const updatedPastedBlocks = updateBlockIds( pastedBlocks );

	// Create new footnotes with updated IDs (using deduplicated list)
	// All footnotes get new IDs, so no need to filter
	const newFootnotesWithIds = uniqueCopiedFootnotes.map( ( fn ) => ( {
		...fn,
		id: idMapping[ fn.id ],
	} ) );

	// Ensure newFootnotes themselves have no duplicate IDs (safety check)
	const newFootnotesMap = new Map();
	newFootnotesWithIds.forEach( ( fn ) => {
		// If somehow we got a duplicate ID, keep only the first one
		if ( ! newFootnotesMap.has( fn.id ) ) {
			newFootnotesMap.set( fn.id, fn );
		}
	} );
	const newFootnotes = Array.from( newFootnotesMap.values() );

	// Merge with existing footnotes, ensuring no duplicates
	// First, deduplicate existing footnotes (in case they already have duplicates)
	const existingFootnotesMap = new Map();
	existingFootnotes.forEach( ( fn ) => {
		if ( ! existingFootnotesMap.has( fn.id ) ) {
			existingFootnotesMap.set( fn.id, fn );
		}
	} );

	// Add new footnotes, ensuring no duplicates
	newFootnotes.forEach( ( newFn ) => {
		if ( ! existingFootnotesMap.has( newFn.id ) ) {
			existingFootnotesMap.set( newFn.id, newFn );
		}
	} );

	// Convert back to array, ensuring unique IDs
	const mergedFootnotes = Array.from( existingFootnotesMap.values() );

	// Update or create footnotes block
	function updateFootnotesBlock( __blocks ) {
		return __blocks.map( ( block ) => {
			if ( block.name === 'core/footnotes' ) {
				return {
					...block,
					attributes: {
						...block.attributes,
						footnotes: mergedFootnotes,
					},
					innerBlocks: updateFootnotesBlock(
						block.innerBlocks || []
					),
				};
			}
			return {
				...block,
				innerBlocks: updateFootnotesBlock( block.innerBlocks || [] ),
			};
		} );
	}

	let updatedDestinationBlocks;
	if ( footnotesBlock ) {
		// Update existing footnotes block
		updatedDestinationBlocks = updateFootnotesBlock( destinationBlocks );
	} else {
		// Create new footnotes block and add it to the destination blocks
		const newFootnotesBlock = createBlock( 'core/footnotes', {
			footnotes: mergedFootnotes,
		} );
		// Add the footnotes block at the end of the destination blocks
		updatedDestinationBlocks = [ ...destinationBlocks, newFootnotesBlock ];
	}

	return {
		blocks: updatedPastedBlocks,
		destinationBlocks: updatedDestinationBlocks,
		idMapping,
		newFootnotes, // Return only the NEW footnotes that were just added
	};
}
