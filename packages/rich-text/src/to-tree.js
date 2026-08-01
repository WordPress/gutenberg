/**
 * Internal dependencies
 */

import { getActiveFormats } from './get-active-formats';
import { getFormatType } from './get-format-type';
import { mapFromFormats } from './format-ranges';
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
 * Build a position-ordered event list from a `_formats` Map, the sparse
 * `replacements` array, and `\n` characters in `text`. Events at the same
 * position fire in the order: closes (inner-first) → opens (outer-first) →
 * replaces. Stable within each group.
 *
 * @param {Map}     formatsMap         Range Map keyed by format ref.
 * @param {Array}   replacements       Sparse array of replacements.
 * @param {string}  text               Text content (scanned for line breaks).
 * @param {boolean} preserveWhiteSpace Render `\n` as text when true.
 * @param {boolean} isEditableTree     Editable trees render `\n` as `<br>`.
 *
 * @return {Array<Object>} Sorted event list.
 */
function buildEvents(
	formatsMap,
	replacements,
	text,
	preserveWhiteSpace,
	isEditableTree
) {
	const events = [];
	let order = 0;
	for ( const [ format, [ rangeStart, rangeEnd ] ] of formatsMap ) {
		events.push( {
			kind: 'open',
			pos: rangeStart,
			format,
			order: order++,
		} );
		events.push( {
			kind: 'close',
			pos: rangeEnd,
			format,
			order: order++,
		} );
	}
	for ( let i = 0; i < replacements.length; i++ ) {
		if ( replacements[ i ] ) {
			events.push( {
				kind: 'replace',
				pos: i,
				replacement: replacements[ i ],
				order: order++,
			} );
		}
	}
	if ( ! preserveWhiteSpace ) {
		for (
			let i = text.indexOf( '\n' );
			i !== -1;
			i = text.indexOf( '\n', i + 1 )
		) {
			events.push( {
				kind: 'replace',
				pos: i,
				isLineBreak: true,
				replacement: {
					type: 'br',
					attributes: isEditableTree
						? { 'data-rich-text-line-break': 'true' }
						: undefined,
					object: true,
				},
				order: order++,
			} );
		}
	}
	events.sort( ( a, b ) => {
		if ( a.pos !== b.pos ) {
			return a.pos - b.pos;
		}
		const rank = { close: 0, open: 1, replace: 2 };
		if ( rank[ a.kind ] !== rank[ b.kind ] ) {
			return rank[ a.kind ] - rank[ b.kind ];
		}
		// Inner closes first (higher order = deeper open), outer opens first.
		if ( a.kind === 'close' ) {
			return b.order - a.order;
		}
		return a.order - b.order;
	} );
	return events;
}

export function toTree( {
	value,
	preserveWhiteSpace,
	createEmpty,
	append,
	getParent,
	isText,
	getText,
	remove,
	appendText,
	onStartIndex,
	onEndIndex,
	isEditableTree,
	placeholder,
} ) {
	const { replacements, text, start, end } = value;
	const formatsMap = value._formats || mapFromFormats( value.formats );
	const activeFormats = getActiveFormats( value );
	const deepestActiveFormat = activeFormats[ activeFormats.length - 1 ];

	const events = buildEvents(
		formatsMap,
		replacements,
		text,
		preserveWhiteSpace,
		isEditableTree
	);

	const tree = createEmpty();
	let pointer = append( tree, '' );
	let cursor = 0;
	let lineHasContent = false;

	// "First wins" selection emission: each side fires at most once, at the
	// earliest moment we can pin it to the right pointer.
	const emittedStart = onStartIndex ? new Set() : null;
	const emittedEnd = onEndIndex ? new Set() : null;

	function emitStart( pos ) {
		if ( ! emittedStart || start !== pos || emittedStart.has( pos ) ) {
			return;
		}
		emittedStart.add( pos );
		onStartIndex( tree, pointer );
	}
	function emitEnd( pos ) {
		if ( ! emittedEnd || end !== pos || emittedEnd.has( pos ) ) {
			return;
		}
		emittedEnd.add( pos );
		onEndIndex( tree, pointer );
	}
	function emitAt( pos ) {
		emitStart( pos );
		emitEnd( pos );
	}

	function appendChars( from, to ) {
		let chunk = '';
		for ( let i = from; i < to; i++ ) {
			const ch = text[ i ];
			if ( ch === OBJECT_REPLACEMENT_CHARACTER ) {
				continue;
			}
			if ( ch === '\n' && ! preserveWhiteSpace ) {
				continue;
			}
			chunk += ch;
		}
		if ( chunk ) {
			if ( ! isText( pointer ) ) {
				pointer = append( getParent( pointer ), '' );
			}
			appendText( pointer, chunk );
			lineHasContent = true;
		}
	}

	// Fill text from cursor up to `until`, emitting selection at the run
	// boundaries plus any interior break positions (start/end strictly
	// inside the run).
	function fillTextUntil( until ) {
		if ( until <= cursor ) {
			return;
		}
		emitAt( cursor );

		const breaks = [];
		if ( start !== undefined && start > cursor && start < until ) {
			breaks.push( start );
		}
		if (
			end !== undefined &&
			end > cursor &&
			end < until &&
			end !== start
		) {
			breaks.push( end );
		}
		breaks.sort( ( a, b ) => a - b );

		let prev = cursor;
		for ( const brk of breaks ) {
			appendChars( prev, brk );
			// Pointer's text length now equals (brk - cursor); emit at it.
			emitAt( brk );
			prev = brk;
		}
		appendChars( prev, until );
		cursor = until;
		emitAt( cursor );
	}

	function processOpen( event ) {
		const { type, tagName, attributes, unregisteredAttributes } =
			event.format;
		const boundaryClass =
			isEditableTree && event.format === deepestActiveFormat;
		const parent = isText( pointer ) ? getParent( pointer ) : pointer;
		const newNode = append(
			parent,
			fromFormat( {
				type,
				tagName,
				attributes,
				unregisteredAttributes,
				boundaryClass,
				isEditableTree,
			} )
		);
		if ( isText( pointer ) && getText( pointer ).length === 0 ) {
			remove( pointer );
		}
		pointer = append( newNode, '' );
	}

	function processClose() {
		// Move pointer back to the parent of the closing format and re-anchor
		// to an empty text node there.
		pointer = append( getParent( getParent( pointer ) ), '' );
	}

	function processReplace( event ) {
		const replacement = event.replacement;
		const { type, attributes, innerHTML } = replacement;
		const formatType = getFormatType( type );
		const parent = isText( pointer ) ? getParent( pointer ) : pointer;

		if ( isEditableTree && type === '#comment' ) {
			pointer = append( parent, {
				type: 'span',
				attributes: {
					contenteditable: 'false',
					'data-rich-text-comment':
						attributes[ 'data-rich-text-comment' ],
				},
			} );
			append(
				append( pointer, { type: 'span' } ),
				attributes[ 'data-rich-text-comment' ].trim()
			);
		} else if ( ! isEditableTree && type === 'script' ) {
			pointer = append(
				parent,
				fromFormat( { type: 'script', isEditableTree } )
			);
			append( pointer, {
				html: decodeURIComponent(
					attributes[ 'data-rich-text-script' ]
				),
			} );
		} else if ( formatType?.contentEditable === false ) {
			if ( innerHTML || isEditableTree ) {
				if ( isEditableTree ) {
					const attrs = {
						contenteditable: 'false',
						'data-rich-text-bogus': true,
					};
					if ( start === event.pos && end === event.pos + 1 ) {
						attrs[ 'data-rich-text-format-boundary' ] = true;
					}
					pointer = append( parent, {
						type: 'span',
						attributes: attrs,
					} );
					if ( event.pos + 1 === text.length ) {
						append( parent, ZWNBSP );
					}
					pointer = append(
						pointer,
						fromFormat( { ...replacement, isEditableTree } )
					);
				} else {
					pointer = append(
						parent,
						fromFormat( { ...replacement, isEditableTree } )
					);
				}
				if ( innerHTML ) {
					append( pointer, { html: innerHTML } );
				}
			}
		} else {
			pointer = append(
				parent,
				fromFormat( {
					...replacement,
					object: true,
					isEditableTree,
				} )
			);
		}
		if ( isText( pointer ) && getText( pointer ).length === 0 ) {
			remove( pointer );
		}
		pointer = append( parent, '' );
		if ( event.isLineBreak ) {
			lineHasContent = false;
		} else {
			lineHasContent = true;
		}
	}

	// Main loop: walk events grouped by position.
	let i = 0;
	while ( i < events.length ) {
		const pos = events[ i ].pos;

		// Fill text between cursor and this position. fillTextUntil emits
		// selection at the run boundaries and any interior break positions.
		fillTextUntil( pos );

		// Closes first — exiting any range whose end is `pos`. Emit BEFORE
		// each close so an `end` at this position is pinned inside the
		// closing range (matches the legacy "emit after appending char at i,
		// before forEach close" semantics).
		while (
			i < events.length &&
			events[ i ].pos === pos &&
			events[ i ].kind === 'close'
		) {
			emitAt( pos );
			processClose();
			i++;
		}

		// Opens — entering any range whose start is `pos`.
		while (
			i < events.length &&
			events[ i ].pos === pos &&
			events[ i ].kind === 'open'
		) {
			processOpen( events[ i ] );
			i++;
		}

		// Emit AFTER opens so a `start` at this position lands inside the
		// new range. `emittedStart`/`emittedEnd` make this a no-op when an
		// earlier emit already fired.
		emitAt( pos );

		// Replaces — each consumes one position; cursor advances.
		while (
			i < events.length &&
			events[ i ].pos === pos &&
			events[ i ].kind === 'replace'
		) {
			processReplace( events[ i ] );
			cursor = pos + 1;
			emitAt( cursor );
			i++;
		}
	}

	// Trailing text after the last event (or the whole value if no events).
	if ( cursor < text.length ) {
		fillTextUntil( text.length );
	} else if ( events.length === 0 ) {
		// Empty value: a single emit so the caret has somewhere to land.
		emitAt( 0 );
	}

	if ( isEditableTree && ! lineHasContent ) {
		append( getParent( pointer ), ZWNBSP );
		if ( placeholder && text.length === 0 ) {
			append( getParent( pointer ), {
				type: 'span',
				attributes: {
					'data-rich-text-placeholder': placeholder,
					// Prevent the placeholder from catching selection.
					style: 'pointer-events:none;user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;',
				},
			} );
		}
	}

	return tree;
}
