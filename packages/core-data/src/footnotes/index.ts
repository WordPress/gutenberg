import { RichTextData, create, toHTMLString } from '@wordpress/rich-text';
import warning from '@wordpress/warning';
import type { Block } from '@wordpress/blocks';
import getFootnotesOrder from './get-footnotes-order';
import type { Footnote } from './types';

let oldFootnotes: Record< string, Footnote > = {};

export function updateFootnotesFromMeta(
	blocks: Array< Block >,
	meta: Record< string, unknown > | undefined
): { blocks: Array< Block >; meta?: Record< string, unknown > } {
	const output = { blocks };
	if ( ! meta ) {
		return output;
	}

	// If meta.footnotes is empty, it means the meta is not registered.
	if ( meta.footnotes === undefined ) {
		return output;
	}

	const newOrder = getFootnotesOrder( blocks );

	// This meta is a string that something else may have written: a plugin, an
	// import, or a direct database edit can leave it malformed or holding
	// something other than an array. Parsing it unguarded throws inside a store
	// subscriber, where no error boundary catches it and the edit is dropped
	// before it reaches editEntityRecord, so the post silently stops saving.
	let parsed: unknown;
	try {
		// The footnotes meta is a JSON string.
		parsed = JSON.parse( ( meta.footnotes as string ) || '[]' );
	} catch {
		// Left undefined, which the check below reports along with a value of
		// the wrong shape.
	}

	let footnotes: Array< Footnote > = [];
	if ( Array.isArray( parsed ) ) {
		footnotes = parsed;
	} else {
		warning( 'Footnotes post meta is not a JSON array; ignoring it.' );
	}

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

	function updateAttributes(
		attributes: Record< string, unknown >
	): Record< string, unknown > {
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
				// Nested attributes are checked as the attributes are.
				attributes[ key ] = (
					value as Array< Record< string, unknown > >
				 ).map( updateAttributes );
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
					// A footnote format names its footnote.
					const id = replacement.attributes![ 'data-fn' ];
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

	function updateBlocksAttributes(
		__blocks: Array< Block >
	): Array< Block > {
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
		...footnotes.reduce< Record< string, Footnote > >( ( acc, fn ) => {
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
