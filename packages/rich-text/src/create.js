/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */

import { isFormatEqual } from './is-format-equal';
import { createElement } from './create-element';
import { mergePair } from './concat';
import {
	LINE_SEPARATOR,
	OBJECT_REPLACEMENT_CHARACTER,
	ZWNBSP,
} from './special-characters';

/**
 * @typedef {Object} RichTextFormat
 *
 * @property {string} type Format type.
 */

/**
 * @typedef {Array<RichTextFormat>} RichTextFormatList
 */

/**
 * @typedef {Object} RichTextValue
 *
 * @property {string}                    text         Text.
 * @property {Array<RichTextFormatList>} formats      Formats.
 * @property {Array<RichTextFormat>}     replacements Replacements.
 * @property {number|undefined}          start        Selection start.
 * @property {number|undefined}          end          Selection end.
 */

function createEmptyValue() {
	return {
		formats: [],
		replacements: [],
		text: '',
	};
}

function simpleFindKey( object, value ) {
	for ( const key in object ) {
		if ( object[ key ] === value ) {
			return key;
		}
	}
}

function toFormat( { type, attributes } ) {
	let formatType;

	if ( attributes && attributes.class ) {
		formatType = select( 'core/rich-text' ).getFormatTypeForClassName(
			attributes.class
		);

		if ( formatType ) {
			// Preserve any additional classes.
			attributes.class = ` ${ attributes.class } `
				.replace( ` ${ formatType.className } `, ' ' )
				.trim();

			if ( ! attributes.class ) {
				delete attributes.class;
			}
		}
	}

	if ( ! formatType ) {
		formatType = select( 'core/rich-text' ).getFormatTypeForBareElement(
			type
		);
	}

	if ( ! formatType ) {
		return attributes ? { type, attributes } : { type };
	}

	if (
		formatType.__experimentalCreatePrepareEditableTree &&
		! formatType.__experimentalCreateOnChangeEditableValue
	) {
		return null;
	}

	if ( ! attributes ) {
		return { type: formatType.name };
	}

	const registeredAttributes = {};
	const unregisteredAttributes = {};

	for ( const name in attributes ) {
		const key = simpleFindKey( formatType.attributes, name );

		if ( key ) {
			registeredAttributes[ key ] = attributes[ name ];
		} else {
			unregisteredAttributes[ name ] = attributes[ name ];
		}
	}

	return {
		type: formatType.name,
		attributes: registeredAttributes,
		unregisteredAttributes,
	};
}

/**
 * Create a RichText value from an `Element` tree (DOM), an HTML string or a
 * plain text string, with optionally a `Range` object to set the selection. If
 * called without any input, an empty value will be created. If
 * `multilineTag` is provided, any content of direct children whose type matches
 * `multilineTag` will be separated by two newlines. The optional functions can
 * be used to filter out content.
 *
 * A value will have the following shape, which you are strongly encouraged not
 * to modify without the use of helper functions:
 *
 * ```js
 * {
 *   text: string,
 *   formats: Array,
 *   replacements: Array,
 *   ?start: number,
 *   ?end: number,
 * }
 * ```
 *
 * As you can see, text and formatting are separated. `text` holds the text,
 * including any replacement characters for objects and lines. `formats`,
 * `objects` and `lines` are all sparse arrays of the same length as `text`. It
 * holds information about the formatting at the relevant text indices. Finally
 * `start` and `end` state which text indices are selected. They are only
 * provided if a `Range` was given.
 *
 * @param {Object}  [$1]                      Optional named arguments.
 * @param {Element} [$1.element]              Element to create value from.
 * @param {string}  [$1.text]                 Text to create value from.
 * @param {string}  [$1.html]                 HTML to create value from.
 * @param {Range}   [$1.range]                Range to create value from.
 * @param {string}  [$1.multilineTag]         Multiline tag if the structure is
 *                                            multiline.
 * @param {Array}   [$1.multilineWrapperTags] Tags where lines can be found if
 *                                            nesting is possible.
 * @param {boolean} [$1.preserveWhiteSpace]   Whether or not to collapse white
 *                                            space characters.
 * @param {boolean} [$1.__unstableIsEditableTree]
 *
 * @return {RichTextValue} A rich text value.
 */
export function create( {
	element,
	text,
	html,
	range,
	multilineTag,
	multilineWrapperTags,
	__unstableIsEditableTree: isEditableTree,
	preserveWhiteSpace,
} = {} ) {
	if ( typeof text === 'string' && text.length > 0 ) {
		return {
			formats: Array( text.length ),
			replacements: Array( text.length ),
			text,
		};
	}

	if ( typeof html === 'string' && html.length > 0 ) {
		// It does not matter which document this is, we're just using it to
		// parse.
		element = createElement( document, html );
	}

	if ( typeof element !== 'object' ) {
		return createEmptyValue();
	}

	if ( ! multilineTag ) {
		return createFromElement( {
			element,
			range,
			isEditableTree,
			preserveWhiteSpace,
		} );
	}

	return createFromMultilineElement( {
		element,
		range,
		multilineTag,
		multilineWrapperTags,
		isEditableTree,
		preserveWhiteSpace,
	} );
}

/**
 * Helper to accumulate the value's selection start and end from the current
 * node and range.
 *
 * @param {Object} accumulator Object to accumulate into.
 * @param {Node}   node        Node to create value with.
 * @param {Range}  range       Range to create value with.
 * @param {Object} value       Value that is being accumulated.
 */
function accumulateSelection( accumulator, node, range, value ) {
	if ( ! range ) {
		return;
	}

	const { parentNode } = node;
	const { startContainer, startOffset, endContainer, endOffset } = range;
	const currentLength = accumulator.text.length;

	// Selection can be extracted from value.
	if ( value.start !== undefined ) {
		accumulator.start = currentLength + value.start;
		// Range indicates that the current node has selection.
	} else if ( node === startContainer && node.nodeType === node.TEXT_NODE ) {
		accumulator.start = currentLength + startOffset;
		// Range indicates that the current node is selected.
	} else if (
		parentNode === startContainer &&
		node === startContainer.childNodes[ startOffset ]
	) {
		accumulator.start = currentLength;
		// Range indicates that the selection is after the current node.
	} else if (
		parentNode === startContainer &&
		node === startContainer.childNodes[ startOffset - 1 ]
	) {
		accumulator.start = currentLength + value.text.length;
		// Fallback if no child inside handled the selection.
	} else if ( node === startContainer ) {
		accumulator.start = currentLength;
	}

	// Selection can be extracted from value.
	if ( value.end !== undefined ) {
		accumulator.end = currentLength + value.end;
		// Range indicates that the current node has selection.
	} else if ( node === endContainer && node.nodeType === node.TEXT_NODE ) {
		accumulator.end = currentLength + endOffset;
		// Range indicates that the current node is selected.
	} else if (
		parentNode === endContainer &&
		node === endContainer.childNodes[ endOffset - 1 ]
	) {
		accumulator.end = currentLength + value.text.length;
		// Range indicates that the selection is before the current node.
	} else if (
		parentNode === endContainer &&
		node === endContainer.childNodes[ endOffset ]
	) {
		accumulator.end = currentLength;
		// Fallback if no child inside handled the selection.
	} else if ( node === endContainer ) {
		accumulator.end = currentLength + endOffset;
	}
}

/**
 * Adjusts the start and end offsets from a range based on a text filter.
 *
 * @param {Node}     node   Node of which the text should be filtered.
 * @param {Range}    range  The range to filter.
 * @param {Function} filter Function to use to filter the text.
 *
 * @return {Object|void} Object containing range properties.
 */
function filterRange( node, range, filter ) {
	if ( ! range ) {
		return;
	}

	const { startContainer, endContainer } = range;
	let { startOffset, endOffset } = range;

	if ( node === startContainer ) {
		startOffset = filter( node.nodeValue.slice( 0, startOffset ) ).length;
	}

	if ( node === endContainer ) {
		endOffset = filter( node.nodeValue.slice( 0, endOffset ) ).length;
	}

	return { startContainer, startOffset, endContainer, endOffset };
}

/**
 * Collapse any whitespace used for HTML formatting to one space character,
 * because it will also be displayed as such by the browser.
 *
 * @param {string} string
 */
function collapseWhiteSpace( string ) {
	return string.replace( /[\n\r\t]+/g, ' ' );
}

const ZWNBSPRegExp = new RegExp( ZWNBSP, 'g' );

/**
 * Removes padding (zero width non breaking spaces) added by `toTree`.
 *
 * @param {string} string
 */
function removePadding( string ) {
	return string.replace( ZWNBSPRegExp, '' );
}

/**
 * Creates a Rich Text value from a DOM element and range.
 *
 * @param {Object}  $1                        Named argements.
 * @param {Element} [$1.element]              Element to create value from.
 * @param {Range}   [$1.range]                Range to create value from.
 * @param {string}  [$1.multilineTag]         Multiline tag if the structure is
 *                                            multiline.
 * @param {Array}   [$1.multilineWrapperTags] Tags where lines can be found if
 *                                            nesting is possible.
 * @param {boolean} [$1.preserveWhiteSpace]   Whether or not to collapse white
 *                                            space characters.
 * @param {Array}   [$1.currentWrapperTags]
 * @param {boolean} [$1.isEditableTree]
 *
 * @return {RichTextValue} A rich text value.
 */
function createFromElement( {
	element,
	range,
	multilineTag,
	multilineWrapperTags,
	currentWrapperTags = [],
	isEditableTree,
	preserveWhiteSpace,
} ) {
	const accumulator = createEmptyValue();

	if ( ! element ) {
		return accumulator;
	}

	if ( ! element.hasChildNodes() ) {
		accumulateSelection( accumulator, element, range, createEmptyValue() );
		return accumulator;
	}

	const length = element.childNodes.length;

	// Optimise for speed.
	for ( let index = 0; index < length; index++ ) {
		const node = element.childNodes[ index ];
		const type = node.nodeName.toLowerCase();

		if ( node.nodeType === node.TEXT_NODE ) {
			let filter = removePadding;

			if ( ! preserveWhiteSpace ) {
				filter = ( string ) =>
					removePadding( collapseWhiteSpace( string ) );
			}

			const text = filter( node.nodeValue );
			range = filterRange( node, range, filter );
			accumulateSelection( accumulator, node, range, { text } );
			// Create a sparse array of the same length as `text`, in which
			// formats can be added.
			accumulator.formats.length += text.length;
			accumulator.replacements.length += text.length;
			accumulator.text += text;
			continue;
		}

		if ( node.nodeType !== node.ELEMENT_NODE ) {
			continue;
		}

		if (
			isEditableTree &&
			// Ignore any placeholders.
			( node.getAttribute( 'data-rich-text-placeholder' ) ||
				// Ignore any line breaks that are not inserted by us.
				( type === 'br' &&
					! node.getAttribute( 'data-rich-text-line-break' ) ) )
		) {
			accumulateSelection( accumulator, node, range, createEmptyValue() );
			continue;
		}

		if ( type === 'script' ) {
			const value = {
				formats: [ , ],
				replacements: [
					{
						type,
						attributes: {
							'data-rich-text-script':
								node.getAttribute( 'data-rich-text-script' ) ||
								encodeURIComponent( node.innerHTML ),
						},
					},
				],
				text: OBJECT_REPLACEMENT_CHARACTER,
			};
			accumulateSelection( accumulator, node, range, value );
			mergePair( accumulator, value );
			continue;
		}

		if ( type === 'br' ) {
			accumulateSelection( accumulator, node, range, createEmptyValue() );
			mergePair( accumulator, create( { text: '\n' } ) );
			continue;
		}

		const lastFormats =
			accumulator.formats[ accumulator.formats.length - 1 ];
		const lastFormat = lastFormats && lastFormats[ lastFormats.length - 1 ];
		const newFormat = toFormat( {
			type,
			attributes: getAttributes( { element: node } ),
		} );
		const format = isFormatEqual( newFormat, lastFormat )
			? lastFormat
			: newFormat;

		if (
			multilineWrapperTags &&
			multilineWrapperTags.indexOf( type ) !== -1
		) {
			const value = createFromMultilineElement( {
				element: node,
				range,
				multilineTag,
				multilineWrapperTags,
				currentWrapperTags: [ ...currentWrapperTags, format ],
				isEditableTree,
				preserveWhiteSpace,
			} );

			accumulateSelection( accumulator, node, range, value );
			mergePair( accumulator, value );
			continue;
		}

		const value = createFromElement( {
			element: node,
			range,
			multilineTag,
			multilineWrapperTags,
			isEditableTree,
			preserveWhiteSpace,
		} );

		accumulateSelection( accumulator, node, range, value );

		if ( ! format ) {
			mergePair( accumulator, value );
		} else if ( value.text.length === 0 ) {
			if ( format.attributes ) {
				mergePair( accumulator, {
					formats: [ , ],
					replacements: [ format ],
					text: OBJECT_REPLACEMENT_CHARACTER,
				} );
			}
		} else {
			// Indices should share a reference to the same formats array.
			// Only create a new reference if `formats` changes.
			function mergeFormats( formats ) {
				if ( mergeFormats.formats === formats ) {
					return mergeFormats.newFormats;
				}

				const newFormats = formats
					? [ format, ...formats ]
					: [ format ];

				mergeFormats.formats = formats;
				mergeFormats.newFormats = newFormats;

				return newFormats;
			}

			// Since the formats parameter can be `undefined`, preset
			// `mergeFormats` with a new reference.
			mergeFormats.newFormats = [ format ];

			mergePair( accumulator, {
				...value,
				formats: Array.from( value.formats, mergeFormats ),
			} );
		}
	}

	return accumulator;
}

/**
 * Creates a rich text value from a DOM element and range that should be
 * multiline.
 *
 * @param {Object}  $1                        Named argements.
 * @param {Element} [$1.element]              Element to create value from.
 * @param {Range}   [$1.range]                Range to create value from.
 * @param {string}  [$1.multilineTag]         Multiline tag if the structure is
 *                                            multiline.
 * @param {Array}   [$1.multilineWrapperTags] Tags where lines can be found if
 *                                            nesting is possible.
 * @param {boolean} [$1.currentWrapperTags]   Whether to prepend a line
 *                                            separator.
 * @param {boolean} [$1.preserveWhiteSpace]   Whether or not to collapse white
 *                                            space characters.
 * @param {boolean} [$1.isEditableTree]
 *
 * @return {RichTextValue} A rich text value.
 */
function createFromMultilineElement( {
	element,
	range,
	multilineTag,
	multilineWrapperTags,
	currentWrapperTags = [],
	isEditableTree,
	preserveWhiteSpace,
} ) {
	const accumulator = createEmptyValue();

	if ( ! element || ! element.hasChildNodes() ) {
		return accumulator;
	}

	const length = element.children.length;

	// Optimise for speed.
	for ( let index = 0; index < length; index++ ) {
		const node = element.children[ index ];

		if ( node.nodeName.toLowerCase() !== multilineTag ) {
			continue;
		}

		const value = createFromElement( {
			element: node,
			range,
			multilineTag,
			multilineWrapperTags,
			currentWrapperTags,
			isEditableTree,
			preserveWhiteSpace,
		} );

		// Multiline value text should be separated by a line separator.
		if ( index !== 0 || currentWrapperTags.length > 0 ) {
			mergePair( accumulator, {
				formats: [ , ],
				replacements:
					currentWrapperTags.length > 0
						? [ currentWrapperTags ]
						: [ , ],
				text: LINE_SEPARATOR,
			} );
		}

		accumulateSelection( accumulator, node, range, value );
		mergePair( accumulator, value );
	}

	return accumulator;
}

/**
 * Gets the attributes of an element in object shape.
 *
 * @param {Object}  $1         Named argements.
 * @param {Element} $1.element Element to get attributes from.
 *
 * @return {Object|void} Attribute object or `undefined` if the element has no
 *                       attributes.
 */
function getAttributes( { element } ) {
	if ( ! element.hasAttributes() ) {
		return;
	}

	const length = element.attributes.length;
	let accumulator;

	// Optimise for speed.
	for ( let i = 0; i < length; i++ ) {
		const { name, value } = element.attributes[ i ];

		if ( name.indexOf( 'data-rich-text-' ) === 0 ) {
			continue;
		}

		const safeName = /^on/i.test( name )
			? 'data-disable-rich-text-' + name
			: name;

		accumulator = accumulator || {};
		accumulator[ safeName ] = value;
	}

	return accumulator;
}
