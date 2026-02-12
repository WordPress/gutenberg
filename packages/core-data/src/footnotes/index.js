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
 * @typedef {Object} UpdateFootnotesFromMetaResult
 * @property {Record<string, unknown>} meta   - The updated meta information.
 * @property {Array}                   blocks - The updated blocks with footnotes processed.
 */

/**
 * Updates footnotes in blocks based on meta information.
 * @param {Array}                   blocks - The blocks to update.
 * @param {Record<string, unknown>} meta   - The meta information to use for updates.
 * @return {UpdateFootnotesFromMetaResult} - The updated blocks and meta information.
 */
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

/**
 * Checks if the block list contains a subscript attribute
 *
 * @param {Array} blockList - The list of blocks to check.
 *
 * @return {boolean} - Returns true if a core/footnotes block is found, otherwise false.
 */
export function hasFootnotesSubscriptBlock( blockList ) {
	for ( const block of blockList ) {
		if (
			block.attributes &&
			block.attributes[ 'data-fn' ] &&
			block.tagName === 'sup'
		) {
			return true;
		}

		if ( block.innerBlocks && block.innerBlocks.length > 0 ) {
			if ( hasFootnotesSubscriptBlock( block.innerBlocks ) ) {
				return true;
			}
		}
	}
	return false;
}
