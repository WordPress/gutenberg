/**
 * WordPress dependencies
 */
import { decodeEntities } from '@wordpress/html-entities';
import { RichTextData, create, toHTMLString } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import getFootnotesOrder from './get-footnotes-order';
import getRichTextValuesCached from './get-rich-text-values-cached';

let oldFootnotes = {};

function getFootnotesFromRawAttributes( value, footnotesFromAttributes ) {
	if ( typeof value === 'string' ) {
		const regex =
			/<sup\b[^>]*\bdata-fn="([^"]+)"[^>]*\bdata-fn-content="([^"]*)"[^>]*>/g;
		let match;

		while ( ( match = regex.exec( value ) ) !== null ) {
			const [ , id, content ] = match;
			if ( id && content ) {
				footnotesFromAttributes[ id ] = decodeEntities( content );
			}
		}

		return;
	}

	if ( Array.isArray( value ) ) {
		value.forEach( ( item ) =>
			getFootnotesFromRawAttributes( item, footnotesFromAttributes )
		);
		return;
	}

	if (
		value &&
		typeof value === 'object' &&
		! ( value instanceof RichTextData )
	) {
		Object.values( value ).forEach( ( item ) =>
			getFootnotesFromRawAttributes( item, footnotesFromAttributes )
		);
	}
}

function getFootnoteContentFromAttributes( blocks ) {
	const footnotesFromAttributes = {};

	for ( const block of blocks ) {
		getFootnotesFromRawAttributes(
			block.attributes,
			footnotesFromAttributes
		);

		for ( const value of getRichTextValuesCached( block ) ) {
			if ( ! value ) {
				continue;
			}

			value.replacements.forEach( ( replacement ) => {
				if ( replacement.type !== 'core/footnote' ) {
					return;
				}

				const id = replacement.attributes?.[ 'data-fn' ];
				const content = replacement.attributes?.[ 'data-fn-content' ];

				if ( id && typeof content === 'string' && content ) {
					footnotesFromAttributes[ id ] = content;
				}
			} );
		}

		Object.assign(
			footnotesFromAttributes,
			getFootnoteContentFromAttributes( block.innerBlocks )
		);
	}

	return footnotesFromAttributes;
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

	const footnotes = meta.footnotes ? JSON.parse( meta.footnotes ) : [];
	const currentOrder = footnotes.map( ( fn ) => fn.id );

	if ( currentOrder.join( '' ) === newOrder.join( '' ) ) {
		return output;
	}

	const footnotesFromAttributes = getFootnoteContentFromAttributes( blocks );

	const newFootnotes = newOrder.map(
		( fnId ) =>
			footnotes.find( ( fn ) => fn.id === fnId ) ||
			( footnotesFromAttributes[ fnId ]
				? { id: fnId, content: footnotesFromAttributes[ fnId ] }
				: null ) ||
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
