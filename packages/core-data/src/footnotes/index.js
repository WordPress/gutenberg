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
			return attributes;
		}

		attributes = { ...attributes };

		for ( const key in attributes ) {
			const value = attributes[ key ];

			if ( Array.isArray( value ) ) {
				attributes[ key ] = value.map( updateAttributes );
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

	return updateBlocksAttributes( blocks );
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
	function updateFootnotesBlock( __blocks ) {
		return __blocks.map( ( block ) => {
			if ( block.name === 'core/footnotes' ) {
				return {
					...block,
					attributes: {
						...block.attributes,
						footnotes: newFootnotes,
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

	// If order hasn't changed, only update numbering in rich text
	if ( currentOrder.join( '' ) === newOrder.join( '' ) ) {
		// Still need to update numbering in rich text attributes
		const newBlocks = updateBlocksAttributesForNumbering(
			blocks,
			newOrder
		);
		return { blocks: newBlocks };
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
	const newBlocks = updateBlocksWithFootnotes(
		blocks,
		newFootnotes,
		newOrder
	);

	return { blocks: newBlocks };
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
