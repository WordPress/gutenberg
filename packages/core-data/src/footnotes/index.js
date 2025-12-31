/**
 * WordPress dependencies
 */
import { RichTextData, create, toHTMLString } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import getFootnotesOrder from './get-footnotes-order';

let oldFootnotes = {};

/**
 * Finds the footnotes block in a blocks array.
 *
 * @param {Array} blocks The blocks array to search.
 * @return {Object|null} The footnotes block, or null if not found.
 */
function findFootnotesBlock( blocks ) {
	for ( const block of blocks ) {
		if ( block.name === 'core/footnotes' ) {
			return block;
		}
		if ( block.innerBlocks ) {
			const found = findFootnotesBlock( block.innerBlocks );
			if ( found ) {
				return found;
			}
		}
	}
	return null;
}

/**
 * Migrates footnotes from post meta to block attributes.
 * Finds the footnotes block and updates its attributes with footnotes from meta.
 *
 * @param {Array}  blocks The blocks array.
 * @param {Object} meta   The post meta object.
 * @return {Array} Updated blocks array with footnotes migrated to block attributes.
 */
export function migrateFootnotesToBlockAttributes( blocks, meta ) {
	if ( ! meta || meta.footnotes === undefined ) {
		return blocks;
	}

	const footnotes = meta.footnotes ? JSON.parse( meta.footnotes ) : [];
	if ( ! Array.isArray( footnotes ) || footnotes.length === 0 ) {
		return blocks;
	}

	function findAndUpdateFootnotesBlock( __blocks ) {
		return __blocks.map( ( block ) => {
			if ( block.name === 'core/footnotes' ) {
				// Only migrate if block doesn't already have footnotes attribute
				if (
					! block.attributes?.footnotes ||
					block.attributes.footnotes.length === 0
				) {
					return {
						...block,
						attributes: {
							...block.attributes,
							footnotes,
						},
					};
				}
			}
			return {
				...block,
				innerBlocks: findAndUpdateFootnotesBlock(
					block.innerBlocks || []
				),
			};
		} );
	}

	return findAndUpdateFootnotesBlock( blocks );
}

/**
 * Updates footnote numbering in rich text attributes across all blocks.
 *
 * @param {Array} blocks   The blocks array.
 * @param {Array} newOrder The new footnote order.
 * @return {Array} Updated blocks array.
 */
function updateBlocksAttributesForNumbering( blocks, newOrder ) {
	function updateAttributes( attributes ) {
		if (
			! attributes ||
			Array.isArray( attributes ) ||
			typeof attributes !== 'object'
		) {
			return { changed: false, attributes };
		}

		let attributesChanged = false;
		attributes = { ...attributes };

		for ( const key in attributes ) {
			const value = attributes[ key ];

			if ( Array.isArray( value ) ) {
				const result = value.map( updateAttributes );
				const arrayChanged = result.some( ( r ) => r.changed );
				if ( arrayChanged ) {
					attributesChanged = true;
					attributes[ key ] = result.map( ( r ) => r.attributes );
				}
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

			let hasFootnotes = false;

			richTextValue.replacements.forEach( ( replacement ) => {
				if ( replacement.type === 'core/footnote' ) {
					const id = replacement.attributes[ 'data-fn' ];
					const index = newOrder.indexOf( id );
					// If footnote ID not found in order, skip it (it was deleted)
					if ( index === -1 ) {
						return;
					}
					const expectedNumber = String( index + 1 );
					const countValue = create( {
						html: replacement.innerHTML,
					} );

					// Always recalculate numbering based on current order
					// This is critical for undo scenarios where blocks are restored
					// with potentially stale numbering
					attributesChanged = true;
					countValue.text = expectedNumber;
					countValue.formats = Array.from(
						{ length: countValue.text.length },
						() => countValue.formats[ 0 ] || null
					);
					countValue.replacements = Array.from(
						{ length: countValue.text.length },
						() => countValue.replacements[ 0 ] || null
					);
					replacement.innerHTML = toHTMLString( {
						value: countValue,
					} );
					hasFootnotes = true;
				}
			} );

			// Always update rich text when footnotes are present to ensure
			// numbering is correct, especially after undo when blocks are restored
			if ( hasFootnotes ) {
				attributesChanged = true;
				// Recreate RichTextData from HTML string to ensure updated
				// replacement innerHTML is properly serialized
				const updatedRichTextValue =
					typeof value === 'string'
						? RichTextData.fromHTMLString(
								richTextValue.toHTMLString()
						  )
						: new RichTextData( richTextValue );
				attributes[ key ] =
					typeof value === 'string'
						? updatedRichTextValue.toHTMLString()
						: updatedRichTextValue;
			}
		}

		return {
			changed: attributesChanged,
			attributes: attributesChanged ? attributes : attributes,
		};
	}

	function updateBlocksAttributes( __blocks ) {
		return __blocks.map( ( block ) => {
			const attributesResult = updateAttributes( block.attributes );
			// Always create new block reference to ensure numbering updates propagate
			// even if attributes didn't change (important for undo scenarios)
			// This forces React to re-render blocks with footnotes on undo
			return {
				...block,
				attributes: attributesResult.attributes,
				innerBlocks: updateBlocksAttributes( block.innerBlocks ),
			};
		} );
	}

	// Always update blocks to ensure numbering is correct, especially on undo
	// Always create new block references to force React re-render
	const newBlocks = updateBlocksAttributes( blocks );
	return newBlocks;
}

/**
 * Updates blocks with new footnotes array and numbering.
 *
 * @param {Array} blocks       The blocks array.
 * @param {Array} newFootnotes The new footnotes array.
 * @param {Array} newOrder     The new footnote order.
 * @return {Array} Updated blocks array.
 */
function updateBlocksWithFootnotes( blocks, newFootnotes, newOrder ) {
	const updatedBlocks = updateBlocksAttributesForNumbering(
		blocks,
		newOrder
	);

	// Update footnotes block with new footnotes array
	// Add a version number to force re-render when numbering changes
	function updateFootnotesBlock( __blocks ) {
		return __blocks.map( ( block ) => {
			if ( block.name === 'core/footnotes' ) {
				return {
					...block,
					attributes: {
						...block.attributes,
						footnotes: newFootnotes,
						// Add version to force re-render when numbering updates
						__footnotesVersion:
							( block.attributes.__footnotesVersion || 0 ) + 1,
					},
					innerBlocks: updateFootnotesBlock( block.innerBlocks ),
				};
			}
			return {
				...block,
				innerBlocks: updateFootnotesBlock( block.innerBlocks ),
			};
		} );
	}

	return updateFootnotesBlock( updatedBlocks );
}

/**
 * Updates footnotes from block attributes (new approach).
 * Handles order changes and updates footnote numbering in rich text.
 *
 * @param {Array} blocks The blocks array.
 * @return {Object} Object with updated blocks.
 */
function updateFootnotesFromBlockAttributes( blocks ) {
	// Find footnotes block
	const footnotesBlock = findFootnotesBlock( blocks );

	if ( ! footnotesBlock?.attributes?.footnotes ) {
		return { blocks };
	}

	const newOrder = getFootnotesOrder( blocks );

	const footnotes = footnotesBlock.attributes.footnotes;
	const currentOrder = footnotes.map( ( fn ) => fn.id );

	// Always update numbering in rich text, even if order hasn't changed
	// This ensures numbering is recalculated on undo when blocks are restored
	// with potentially stale numbering
	let updatedBlocks = updateBlocksAttributesForNumbering( blocks, newOrder );

	// Update footnotes block to force re-render when numbering changes
	// This ensures the canvas updates with correct numbering after undo
	function updateFootnotesBlockVersion( __blocks ) {
		return __blocks.map( ( block ) => {
			if ( block.name === 'core/footnotes' ) {
				return {
					...block,
					attributes: {
						...block.attributes,
						// Increment version to force re-render
						__footnotesVersion:
							( block.attributes.__footnotesVersion || 0 ) + 1,
					},
					innerBlocks: updateFootnotesBlockVersion(
						block.innerBlocks
					),
				};
			}
			return {
				...block,
				innerBlocks: updateFootnotesBlockVersion( block.innerBlocks ),
			};
		} );
	}

	// If order hasn't changed, return blocks with updated numbering and version
	if ( currentOrder.join( '' ) === newOrder.join( '' ) ) {
		updatedBlocks = updateFootnotesBlockVersion( updatedBlocks );
		return { blocks: updatedBlocks };
	}

	// Order changed - reorder footnotes array
	const newFootnotes = newOrder.map( ( fnId ) => {
		const existingFootnote = footnotes.find( ( fn ) => fn.id === fnId );
		if ( existingFootnote ) {
			return existingFootnote;
		}
		// Footnote not found in block attributes - create empty one
		return {
			id: fnId,
			content: '',
		};
	} );

	// Update blocks: reorder footnotes array and update numbering
	updatedBlocks = updateBlocksWithFootnotes(
		updatedBlocks,
		newFootnotes,
		newOrder
	);

	return { blocks: updatedBlocks };
}

export function updateFootnotesFromMeta( blocks, meta ) {
	const output = { blocks };

	if ( ! meta ) {
		return output;
	}

	// If meta.footnotes is empty, it means the meta is not registered.
	if ( meta.footnotes === undefined ) {
		return output;
	}

	// Check if footnotes block has footnotes in block attributes (new approach)
	const footnotesBlock = findFootnotesBlock( blocks );

	const hasBlockAttributes =
		footnotesBlock?.attributes?.footnotes &&
		Array.isArray( footnotesBlock.attributes.footnotes ) &&
		footnotesBlock.attributes.footnotes.length > 0 &&
		footnotesBlock.attributes.footnotes.some(
			( fn ) => fn.content && fn.content.trim()
		);

	// If footnotes are in block attributes, use new approach
	if ( hasBlockAttributes ) {
		return updateFootnotesFromBlockAttributes( blocks );
	}

	// OLD APPROACH: Meta-based footnotes (can be cleanly removed later)
	// ================================================================
	const newOrder = getFootnotesOrder( blocks );

	const footnotes = meta.footnotes ? JSON.parse( meta.footnotes ) : [];
	const currentOrder = footnotes.map( ( fn ) => fn.id );

	if ( currentOrder.join( '' ) === newOrder.join( '' ) ) {
		return output;
	}

	const newFootnotes = newOrder.map(
		( fnId ) =>
			footnotes.find( ( fn ) => fn.id === fnId ) ||
			oldFootnotes[ fnId ] || {
				id: fnId,
				content: '',
			}
	);

	function updateAttributes( attributes ) {
		// Only attempt to update attributes, if attributes is an object.
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
				attributes[ key ] = value.map( updateAttributes );
				continue;
			}

			// To do, remove support for string values?
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

			let hasFootnotes = false;

			richTextValue.replacements.forEach( ( replacement ) => {
				if ( replacement.type === 'core/footnote' ) {
					const id = replacement.attributes[ 'data-fn' ];
					const index = newOrder.indexOf( id );
					// The innerHTML contains the count wrapped in a link.
					const countValue = create( {
						html: replacement.innerHTML,
					} );
					countValue.text = String( index + 1 );
					countValue.formats = Array.from(
						{ length: countValue.text.length },
						() => countValue.formats[ 0 ]
					);
					countValue.replacements = Array.from(
						{ length: countValue.text.length },
						() => countValue.replacements[ 0 ]
					);
					replacement.innerHTML = toHTMLString( {
						value: countValue,
					} );
					hasFootnotes = true;
				}
			} );

			if ( hasFootnotes ) {
				attributes[ key ] =
					typeof value === 'string'
						? richTextValue.toHTMLString()
						: richTextValue;
			}
		}

		return attributes;
	}

	function updateBlocksAttributes( __blocks ) {
		return __blocks.map( ( block ) => {
			return {
				...block,
				attributes: updateAttributes( block.attributes ),
				innerBlocks: updateBlocksAttributes( block.innerBlocks ),
			};
		} );
	}

	// We need to go through all block attributes deeply and update the
	// footnote anchor numbering (textContent) to match the new order.
	const newBlocks = updateBlocksAttributes( blocks );

	oldFootnotes = {
		...oldFootnotes,
		...footnotes.reduce( ( acc, fn ) => {
			if ( ! newOrder.includes( fn.id ) ) {
				acc[ fn.id ] = fn;
			}
			return acc;
		}, {} ),
	};

	return {
		meta: {
			...meta,
			footnotes: JSON.stringify( newFootnotes ),
		},
		blocks: newBlocks,
	};
}
