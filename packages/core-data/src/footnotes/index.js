/**
 * External dependencies
 */
import { v4 as createId } from 'uuid';

/**
 * WordPress dependencies
 */
import { RichTextData, create, toHTMLString } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import getFootnotesOrder from './get-footnotes-order';

let oldFootnotes = {};

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

	const newFootnotes = newOrder
		.map(
			( fnId ) =>
				footnotes.find( ( fn ) => fn.id === fnId ) ||
				oldFootnotes[ fnId ] || {
					id: fnId,
					content: '',
				}
		)
		.reduce( ( acc, fn ) => {
			if ( acc.map( ( { id } ) => id ).includes( fn.id ) ) {
				acc.push( { ...fn, id: createId() } );
			} else {
				acc.push( fn );
			}
			return acc;
		}, [] );

	const idMap = newOrder.map( ( currentValue, i ) => ( {
		currentValue,
		newValue: newFootnotes[ i ].id,
		used: false,
	} ) );

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

			richTextValue.replacements.forEach( ( replacement ) => {
				if ( replacement.type === 'core/footnote' ) {
					const id = replacement.attributes[ 'data-fn' ];
					const index = idMap.findIndex(
						( { currentValue, used } ) => {
							return currentValue === id && ! used;
						}
					);
					idMap[ index ].used = true;
					// The innerHTML contains the count wrapped in a link.
					const countValue = create( {
						html: replacement.innerHTML.replace(
							idMap[ index ].currentValue,
							idMap[ index ].newValue
						),
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
					replacement.attributes[ 'data-fn' ] =
						idMap[ index ].newValue;
					replacement.innerHTML = toHTMLString( {
						value: countValue,
					} ).replace(
						idMap[ index ].currentValue,
						idMap[ index ].newValue
					);
				}
			} );

			attributes[ key ] =
				typeof value === 'string'
					? richTextValue.toHTMLString()
					: richTextValue;
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
