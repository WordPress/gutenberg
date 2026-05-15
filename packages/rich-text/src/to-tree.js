/**
 * Internal dependencies
 */

import { getActiveFormats } from './get-active-formats';
import { getFormatType } from './get-format-type';
import { OBJECT_REPLACEMENT_CHARACTER, ZWNBSP } from './special-characters';

function restoreOnAttributes( attributes, isEditableTree ) {
	if ( isEditableTree ) {
		return attributes;
	}

	const newAttributes = {};

	for ( const key in attributes ) {
		let newKey = key;
		if ( key.startsWith( 'data-disable-rich-text-' ) ) {
			newKey = key.slice( 'data-disable-rich-text-'.length );
		}

		newAttributes[ newKey ] = attributes[ key ];
	}

	return newAttributes;
}

/**
 * Converts a format object to information that can be used to create an element
 * from (type, attributes and object).
 *
 * @param {Object}  $1                        Named parameters.
 * @param {string}  $1.type                   The format type.
 * @param {string}  $1.tagName                The tag name.
 * @param {Object}  $1.attributes             The format attributes.
 * @param {Object}  $1.unregisteredAttributes The unregistered format
 *                                            attributes.
 * @param {boolean} $1.object                 Whether or not it is an object
 *                                            format.
 * @param {boolean} $1.boundaryClass          Whether or not to apply a boundary
 *                                            class.
 * @param {boolean} $1.isEditableTree
 *
 * @return {Object} Information to be used for element creation.
 */
function fromFormat( {
	type,
	tagName,
	attributes,
	unregisteredAttributes,
	object,
	boundaryClass,
	isEditableTree,
} ) {
	const formatType = getFormatType( type );

	let elementAttributes = {};

	if ( boundaryClass && isEditableTree ) {
		elementAttributes[ 'data-rich-text-format-boundary' ] = 'true';
	}

	if ( ! formatType ) {
		if ( attributes ) {
			elementAttributes = { ...attributes, ...elementAttributes };
		}

		return {
			type,
			attributes: restoreOnAttributes(
				elementAttributes,
				isEditableTree
			),
			object,
		};
	}

	elementAttributes = { ...unregisteredAttributes, ...elementAttributes };

	for ( const name in attributes ) {
		const key = formatType.attributes
			? formatType.attributes[ name ]
			: false;

		if ( key ) {
			elementAttributes[ key ] = attributes[ name ];
		} else {
			elementAttributes[ name ] = attributes[ name ];
		}
	}

	if ( formatType.className ) {
		if ( elementAttributes.class ) {
			elementAttributes.class = `${ formatType.className } ${ elementAttributes.class }`;
		} else {
			elementAttributes.class = formatType.className;
		}
	}

	return {
		type: tagName || formatType.tagName,
		object: formatType.object,
		attributes: restoreOnAttributes( elementAttributes, isEditableTree ),
	};
}

/**
 * Build a flat list of format ranges from a sparse `formats` array. Each
 * range records the format object, its `start` index, and its `end` index.
 * Adjacent positions whose `formats` arrays share the same reference at the
 * same depth are merged into one range; a position where the reference
 * changes (or disappears) closes the existing range and may open a new one.
 *
 * The ranges are returned in the order they open, which is the order
 * `toTree` needs to emit elements (outermost format first). An array (rather
 * than a Map) keeps every range distinct even when the same format reference
 * is reused across non-adjacent ranges.
 *
 * @param {Array} formats Sparse array of format arrays.
 *
 * @return {Array<{format: Object, start: number, end: number}>} Ranges in open order.
 */
function buildFormatRanges( formats ) {
	const ranges = [];
	const openStack = []; // Array of indices into `ranges` in open order.

	for ( let i = 0; i < formats.length; i++ ) {
		const list = formats[ i ] || [];

		// Find the divergence point: how many leading formats still match
		// what is currently open.
		let diverge = 0;
		while (
			diverge < openStack.length &&
			diverge < list.length &&
			ranges[ openStack[ diverge ] ].format === list[ diverge ]
		) {
			diverge++;
		}

		// Close ranges deeper than the divergence point.
		while ( openStack.length > diverge ) {
			ranges[ openStack.pop() ].end = i;
		}

		// Open new ranges from the divergence point onwards.
		for ( let j = diverge; j < list.length; j++ ) {
			openStack.push( ranges.length );
			ranges.push( {
				format: list[ j ],
				start: i,
				end: formats.length,
			} );
		}
	}

	// Close anything still open at the end.
	while ( openStack.length > 0 ) {
		ranges[ openStack.pop() ].end = formats.length;
	}

	return ranges;
}

export function toTree( {
	value,
	preserveWhiteSpace,
	createEmpty,
	append,
	getParent,
	onStartIndex,
	onEndIndex,
	isEditableTree,
	placeholder,
} ) {
	const { formats, replacements, text, start, end } = value;
	// Derive a flat list of format ranges from the sparse `formats` array.
	// This is the source of truth for `toTree`: ranges are opened/closed in
	// order, sliced text is appended between them.
	const ranges = buildFormatRanges( formats );
	const activeFormats = getActiveFormats( value );
	const deepestActiveFormat = activeFormats[ activeFormats.length - 1 ];

	const tree = createEmpty();
	let pointer = tree;
	let index = 0;
	const closeAt = [];

	function emitSelectionAt( node, _start, _end, isInline ) {
		if ( ! isEditableTree ) {
			return;
		}

		if ( onStartIndex && start >= _start && start <= _end ) {
			onStartIndex( tree, node, isInline ? [ start - _start ] : [] );
		}

		if ( onEndIndex && end >= _start && end <= _end ) {
			onEndIndex( tree, node, isInline ? [ end - _start ] : [] );
		}
	}

	function appendChunk( chunk, _start, _end ) {
		// A run of plain text becomes a single text node.
		if (
			typeof chunk === 'string' &&
			chunk !== OBJECT_REPLACEMENT_CHARACTER &&
			chunk !== '\n'
		) {
			const node = append( pointer, chunk );
			emitSelectionAt( node, _start, _end, true );
			return;
		}

		if ( chunk === '\n' ) {
			if ( preserveWhiteSpace ) {
				const node = append( pointer, '\n' );
				emitSelectionAt( node, _start, _end, true );
				return;
			}

			const node = append( pointer, {
				type: 'br',
				attributes: isEditableTree
					? { 'data-rich-text-line-break': 'true' }
					: undefined,
				object: true,
			} );
			emitSelectionAt( node, _start, _end, false );
			return;
		}

		// OBJECT_REPLACEMENT_CHARACTER — driven by `replacements[ _start ]`.
		const replacement = replacements[ _start ];
		if ( ! replacement ) {
			return;
		}

		if ( isEditableTree && replacement.type === '#comment' ) {
			const commentSpan = append( pointer, {
				type: 'span',
				attributes: {
					contenteditable: 'false',
					'data-rich-text-comment':
						replacement.attributes[ 'data-rich-text-comment' ],
				},
			} );
			append(
				append( commentSpan, { type: 'span' } ),
				replacement.attributes[ 'data-rich-text-comment' ].trim()
			);
			emitSelectionAt( commentSpan, _start, _end, false );
			return;
		}

		if ( ! isEditableTree && replacement.type === 'script' ) {
			const scriptNode = append(
				pointer,
				fromFormat( { type: 'script', isEditableTree } )
			);
			append( scriptNode, {
				html: decodeURIComponent(
					replacement.attributes[ 'data-rich-text-script' ]
				),
			} );
			return;
		}

		const formatType = getFormatType( replacement.type );

		if ( formatType?.contentEditable === false ) {
			const { innerHTML } = replacement;

			if ( ! innerHTML && ! isEditableTree ) {
				return;
			}

			let host = pointer;

			if ( isEditableTree ) {
				const attrs = {
					contenteditable: 'false',
					'data-rich-text-bogus': true,
				};
				if ( start === _start && end === _end ) {
					attrs[ 'data-rich-text-format-boundary' ] = true;
				}
				host = append( pointer, { type: 'span', attributes: attrs } );

				// Safari/Firefox have trouble placing the caret after a non
				// editable element at the very end of the field. Append a
				// ZWNBSP so the caret has somewhere to land.
				if ( _end === text.length ) {
					append( pointer, ZWNBSP );
				}
			}

			const formatNode = append(
				host,
				fromFormat( { ...replacement, isEditableTree } )
			);

			if ( innerHTML ) {
				append( formatNode, { html: innerHTML } );
			}

			emitSelectionAt( host, _start, _end, false );
			return;
		}

		// Regular object replacement (e.g. <img>).
		const objectNode = append(
			pointer,
			fromFormat( { ...replacement, object: true, isEditableTree } )
		);
		emitSelectionAt( objectNode, _start, _end, false );
	}

	function appendText( _start, _end ) {
		if ( _start >= _end ) {
			return;
		}

		const slice = text.slice( _start, _end );
		let buffer = '';
		let bufferStart = _start;
		let i = 0;

		for ( ; i < slice.length; i++ ) {
			const ch = slice[ i ];
			if ( ch === '\n' || ch === OBJECT_REPLACEMENT_CHARACTER ) {
				if ( buffer ) {
					appendChunk( buffer, bufferStart, _start + i );
					buffer = '';
				}
				appendChunk( ch, _start + i, _start + i + 1 );
				bufferStart = _start + i + 1;
			} else {
				buffer += ch;
			}
		}

		if ( buffer ) {
			appendChunk( buffer, bufferStart, _start + i );
		}
	}

	function fillTo( untilIndex ) {
		// Close any formats whose end has been reached.
		while (
			closeAt.length > 0 &&
			untilIndex >= closeAt[ closeAt.length - 1 ]
		) {
			const endIndex = closeAt.pop();
			appendText( index, endIndex );
			pointer = getParent( pointer );
			index = endIndex;
		}

		appendText( index, untilIndex );
		index = untilIndex;
	}

	for ( const { format, start: formatStart, end: formatEnd } of ranges ) {
		fillTo( formatStart );

		const boundaryClass = isEditableTree && format === deepestActiveFormat;
		pointer = append(
			pointer,
			fromFormat( { ...format, boundaryClass, isEditableTree } )
		);
		closeAt.push( formatEnd );
	}

	fillTo( text.length );

	if ( ! isEditableTree ) {
		return tree;
	}

	const padding = append( pointer, ZWNBSP );

	// When the selection sits at the very end (and no chunk has claimed it),
	// pin it to the trailing padding.
	if ( text.length === 0 ) {
		if ( onStartIndex && start === 0 ) {
			onStartIndex( tree, padding, [ 0 ] );
		}
		if ( onEndIndex && end === 0 ) {
			onEndIndex( tree, padding, [ 0 ] );
		}
	}

	if ( placeholder && text.length === 0 ) {
		append( pointer, {
			type: 'span',
			attributes: {
				'data-rich-text-placeholder': placeholder,
				// Prevent the placeholder from catching selection.
				style: 'pointer-events:none;user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;',
			},
		} );
	}

	return tree;
}
