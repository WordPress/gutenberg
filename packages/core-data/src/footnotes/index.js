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

export function updateFootnotesFromMeta( blocks, meta ) {
	const output = { blocks };
	if ( ! meta ) {
		return output;
	}

	// If meta.footnotes is empty, it means the meta is not registered.
	if ( meta.footnotes === undefined ) {
		return output;
	}

	const newOrder = getFootnotesOrder( blocks );

	// Find footnotes block and check if it has footnotes in attributes
	let footnotesBlock = null;
	function findFootnotesBlock( __blocks ) {
		for ( const block of __blocks ) {
			if ( block.name === 'core/footnotes' ) {
				footnotesBlock = block;
				return;
			}
			if ( block.innerBlocks ) {
				findFootnotesBlock( block.innerBlocks );
			}
		}
	}
	findFootnotesBlock( blocks );

	// If footnotes block has contentful footnotes in attributes, they are the source of truth
	// Only update if order has changed or if we need to sync from meta
	if (
		footnotesBlock?.attributes?.footnotes &&
		Array.isArray( footnotesBlock.attributes.footnotes ) &&
		footnotesBlock.attributes.footnotes.length > 0 &&
		footnotesBlock.attributes.footnotes.some(
			( fn ) => fn.content && fn.content.trim()
		)
	) {
		const blockFootnotesOrder = footnotesBlock.attributes.footnotes.map(
			( fn ) => fn.id
		);
		// If order matches, block attributes are source of truth - don't update
		if ( blockFootnotesOrder.join( '' ) === newOrder.join( '' ) ) {
			return output;
		}
		// Order changed - we'll reorder but preserve content below
	}

	// Check if block attributes have footnotes with content
	const hasBlockAttributesWithContent =
		footnotesBlock?.attributes?.footnotes &&
		Array.isArray( footnotesBlock.attributes.footnotes ) &&
		footnotesBlock.attributes.footnotes.length > 0 &&
		footnotesBlock.attributes.footnotes.some(
			( fn ) => fn.content && fn.content.trim()
		);

	// Prioritize footnotes from block attributes over meta
	let footnotes = [];
	if ( hasBlockAttributesWithContent ) {
		// Use footnotes from block attributes as source of truth
		footnotes = footnotesBlock.attributes.footnotes;
		const blockFootnotesOrder = footnotes.map( ( fn ) => fn.id );
		// If order matches, no need to update - block attributes are source of truth
		if ( blockFootnotesOrder.join( '' ) === newOrder.join( '' ) ) {
			return output;
		}
	} else if (
		footnotesBlock?.attributes?.footnotes &&
		Array.isArray( footnotesBlock.attributes.footnotes ) &&
		footnotesBlock.attributes.footnotes.length > 0
	) {
		// Block attributes exist but have no content, use them anyway
		footnotes = footnotesBlock.attributes.footnotes;
	} else if ( meta.footnotes ) {
		// Fall back to meta if block attributes don't have footnotes
		footnotes = JSON.parse( meta.footnotes );
	}

	const currentOrder = footnotes.map( ( fn ) => fn.id );

	// If order matches and we're using meta footnotes, also return early
	if ( currentOrder.join( '' ) === newOrder.join( '' ) ) {
		return output;
	}

	// Create new footnotes array preserving content from existing footnotes
	const newFootnotes = newOrder.map( ( fnId ) => {
		// First, always check block attributes for content (they're the source of truth)
		if ( footnotesBlock?.attributes?.footnotes ) {
			const blockFootnote = footnotesBlock.attributes.footnotes.find(
				( fn ) => fn.id === fnId
			);
			if ( blockFootnote ) {
				return blockFootnote;
			}
		}
		// Then try to find in existing footnotes (from meta or block attributes without content)
		const existingFootnote = footnotes.find( ( fn ) => fn.id === fnId );
		if ( existingFootnote ) {
			return existingFootnote;
		}
		// Then try oldFootnotes cache
		if ( oldFootnotes[ fnId ] ) {
			return oldFootnotes[ fnId ];
		}
		// Finally create empty footnote
		return {
			id: fnId,
			content: '',
		};
	} );

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
			// Update footnotes block with new footnotes array
			if ( block.name === 'core/footnotes' ) {
				// Check if block already has footnotes with content - if so, preserve them
				const existingFootnotes = block.attributes?.footnotes;
				const hasContentfulFootnotes =
					Array.isArray( existingFootnotes ) &&
					existingFootnotes.length > 0 &&
					existingFootnotes.some(
						( fn ) => fn.content && fn.content.trim()
					);

				// Only update if we're not overwriting contentful footnotes
				// or if the order has changed and we need to reorder
				const shouldUpdate =
					! hasContentfulFootnotes ||
					currentOrder.join( '' ) !== newOrder.join( '' );

				return {
					...block,
					attributes: {
						...updateAttributes( block.attributes ),
						footnotes: shouldUpdate
							? newFootnotes
							: existingFootnotes,
					},
					innerBlocks: updateBlocksAttributes( block.innerBlocks ),
				};
			}
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
