import { select } from '@wordpress/data';
import { store as richTextStore } from './store';
import { createElement } from './create-element';
import { mergePair } from './concat';
import { OBJECT_REPLACEMENT_CHARACTER, ZWNBSP } from './special-characters';
import { toHTMLString } from './to-html-string';
import { getTextContent } from './get-text-content';
import type {
	FormatType,
	ParsedFormat,
	RichTextContent,
	RichTextFormatList,
	RichTextValue,
	SelectionRange,
} from './types';

function createEmptyValue() {
	return {
		formats: [],
		replacements: [],
		text: '',
	} as unknown as RichTextValue;
}

function toFormat( {
	tagName,
	attributes,
}: {
	tagName: string;
	attributes?: Record< string, string >;
} ) {
	let formatType: FormatType | undefined;

	if ( attributes && attributes.class ) {
		formatType = select( richTextStore ).getFormatTypeForClassName(
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
		formatType =
			select( richTextStore ).getFormatTypeForBareElement( tagName );
	}

	if ( ! formatType ) {
		return attributes ? { type: tagName, attributes } : { type: tagName };
	}

	if (
		formatType.__experimentalCreatePrepareEditableTree &&
		! formatType.__experimentalCreateOnChangeEditableValue
	) {
		return null;
	}

	if ( ! attributes ) {
		return { formatType, type: formatType.name, tagName };
	}

	const registeredAttributes: Record< string, string > = {};
	const unregisteredAttributes: Record< string, string > = {};
	const _attributes = { ...attributes };

	for ( const key in formatType.attributes ) {
		const name = formatType.attributes![ key ];

		registeredAttributes[ key ] = _attributes[ name ];

		// delete the attribute and what's left is considered
		// to be unregistered.
		delete _attributes[ name ];

		if ( typeof registeredAttributes[ key ] === 'undefined' ) {
			delete registeredAttributes[ key ];
		}
	}

	for ( const name in _attributes ) {
		unregisteredAttributes[ name ] = attributes[ name ];
	}

	if ( formatType.contentEditable === false ) {
		delete unregisteredAttributes.contenteditable;
	}

	// Omit empty attribute objects so that parsed formats have the same shape
	// as manually applied formats (`{ type, attributes? }`), which is required
	// for format equality checks.
	const format: ParsedFormat = {
		formatType,
		type: formatType.name,
		tagName,
	};

	if ( Object.keys( registeredAttributes ).length ) {
		format.attributes = registeredAttributes;
	}

	if ( Object.keys( unregisteredAttributes ).length ) {
		format.unregisteredAttributes = unregisteredAttributes;
	}

	return format;
}

/**
 * The RichTextData class is used to instantiate a wrapper around rich text
 * values, with methods that can be used to transform or manipulate the data.
 *
 * - Create an empty instance: `new RichTextData()`.
 * - Create one from an HTML string: `RichTextData.fromHTMLString(
 *   '<em>hello</em>' )`.
 * - Create one from a wrapper HTMLElement: `RichTextData.fromHTMLElement(
 *   document.querySelector( 'p' ) )`.
 * - Create one from plain text: `RichTextData.fromPlainText( '1\n2' )`.
 * - Create one from a rich text value: `new RichTextData( { text: '...',
 *   formats: [ ... ] } )`.
 *
 * @todo Add methods to manipulate the data, such as applyFormat, slice etc.
 */
export class RichTextData {
	#value: RichTextContent;
	declare originalHTML?: string;

	static empty() {
		return new RichTextData();
	}
	static fromPlainText( text: string ) {
		return new RichTextData( create( { text } ) );
	}
	static fromHTMLString( html: string ) {
		return new RichTextData( create( { html } ) );
	}
	/**
	 * Create a RichTextData instance from an HTML element.
	 *
	 * @param htmlElement                The HTML element to create the instance from.
	 * @param options                    Options.
	 * @param options.preserveWhiteSpace Whether to preserve white space.
	 * @return The RichTextData instance.
	 */
	static fromHTMLElement(
		htmlElement: HTMLElement,
		options: { preserveWhiteSpace?: boolean } = {}
	) {
		const { preserveWhiteSpace = false } = options;
		const element = preserveWhiteSpace
			? htmlElement
			: collapseWhiteSpace( htmlElement );
		const richTextData = new RichTextData( create( { element } ) );
		Object.defineProperty( richTextData, 'originalHTML', {
			value: htmlElement.innerHTML,
		} );
		return richTextData;
	}
	constructor( init: RichTextContent = createEmptyValue() ) {
		this.#value = init;
	}
	toPlainText() {
		return getTextContent( this.#value as RichTextValue );
	}
	// We could expose `toHTMLElement` at some point as well, but we'd only use
	// it internally.
	/**
	 * Convert the rich text value to an HTML string.
	 *
	 * @param options                    Options.
	 * @param options.preserveWhiteSpace Whether to preserve white space.
	 * @return The HTML string.
	 */
	toHTMLString( {
		preserveWhiteSpace,
	}: { preserveWhiteSpace?: boolean } = {} ) {
		return (
			this.originalHTML ||
			toHTMLString( {
				value: this.#value as RichTextValue,
				preserveWhiteSpace,
			} )
		);
	}
	valueOf() {
		return this.toHTMLString();
	}
	toString() {
		return this.toHTMLString();
	}
	toJSON() {
		return this.toHTMLString();
	}
	get length() {
		return this.text.length;
	}
	get formats() {
		return this.#value.formats;
	}
	get replacements() {
		return this.#value.replacements;
	}
	get text() {
		return this.#value.text;
	}
}

for ( const name of Object.getOwnPropertyNames( String.prototype ) ) {
	if ( RichTextData.prototype.hasOwnProperty( name ) ) {
		continue;
	}

	Object.defineProperty( RichTextData.prototype, name, {
		value( this: RichTextData, ...args: unknown[] ) {
			// Should we convert back to RichTextData?
			return (
				this.toHTMLString() as unknown as Record<
					string,
					( ...args: unknown[] ) => unknown
				>
			 )[ name ]( ...args );
		},
	} );
}

/**
 * Create a RichText value from an `Element` tree (DOM), an HTML string or a
 * plain text string, with optionally a `Range` object to set the selection. If
 * called without any input, an empty value will be created. The optional
 * functions can be used to filter out content.
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
 * @param [options]                          Optional named arguments.
 * @param [options.element]                  Element to create value from.
 * @param [options.text]                     Text to create value from.
 * @param [options.html]                     HTML to create value from.
 * @param [options.range]                    Range to create value from.
 * @param [options.__unstableIsEditableTree]
 * @return A rich text value.
 */
export function create( {
	element,
	text,
	html,
	range,
	__unstableIsEditableTree: isEditableTree,
}: {
	element?: Element;
	text?: string;
	html?: string | RichTextData;
	range?: Range | null;
	__unstableIsEditableTree?: boolean;
} = {} ) {
	if ( html instanceof RichTextData ) {
		return {
			text: html.text,
			formats: html.formats,
			replacements: html.replacements,
		} as RichTextValue;
	}

	if ( typeof text === 'string' && text.length > 0 ) {
		return {
			formats: Array( text.length ),
			replacements: Array( text.length ),
			text,
		} as RichTextValue;
	}

	if ( typeof html === 'string' && html.length > 0 ) {
		// It does not matter which document this is, we're just using it to
		// parse.
		element = createElement( document, html );
	}

	if ( typeof element !== 'object' ) {
		return createEmptyValue();
	}

	return createFromElement( {
		element,
		range,
		isEditableTree,
	} );
}

/**
 * Helper to accumulate the value's selection start and end from the current
 * node and range.
 *
 * @param accumulator Object to accumulate into.
 * @param node        Node to create value with.
 * @param range       Range to create value with.
 * @param value       Value that is being accumulated.
 */
function accumulateSelection(
	accumulator: RichTextValue,
	node: Node,
	range: SelectionRange | null | undefined,
	value: Pick< RichTextValue, 'text' > &
		Partial< Pick< RichTextValue, 'start' | 'end' > >
) {
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
 * @param node   Node of which the text should be filtered.
 * @param range  The range to filter.
 * @param filter Function to use to filter the text.
 *
 * @return Object containing range properties.
 */
function filterRange(
	node: Node,
	range: SelectionRange | null | undefined,
	filter: ( string: string ) => string
) {
	if ( ! range ) {
		return;
	}

	const { startContainer, endContainer } = range;
	let { startOffset, endOffset } = range;

	if ( node === startContainer ) {
		startOffset = filter( node.nodeValue!.slice( 0, startOffset ) ).length;
	}

	if ( node === endContainer ) {
		endOffset = filter( node.nodeValue!.slice( 0, endOffset ) ).length;
	}

	return { startContainer, startOffset, endContainer, endOffset };
}

/**
 * Collapse any whitespace used for HTML formatting to one space character,
 * because it will also be displayed as such by the browser.
 *
 * We need to strip it from the content because we use white-space: pre-wrap for
 * displaying editable rich text. Without using white-space: pre-wrap, the
 * browser will litter the content with non breaking spaces, among other issues.
 * See packages/rich-text/src/component/use-default-style.js.
 *
 * @see
 * https://developer.mozilla.org/en-US/docs/Web/CSS/white-space-collapse#collapsing_of_white_space
 *
 * @param element
 * @param isRoot
 * @param hasPrecedingSpace
 * @param hasTrailingSpace
 *
 * @return New element with collapsed whitespace.
 */
function collapseWhiteSpace(
	element: HTMLElement,
	isRoot = true,
	hasPrecedingSpace = false,
	hasTrailingSpace = false
) {
	const clone = element.cloneNode( true ) as HTMLElement;
	clone.normalize();
	Array.from( clone.childNodes ).forEach( ( node, i, nodes ) => {
		if ( node.nodeType === node.TEXT_NODE ) {
			let newNodeValue = node.nodeValue!;

			if ( /[\n\t\r\f]/.test( newNodeValue ) ) {
				newNodeValue = newNodeValue.replace( /[\n\t\r\f]+/g, ' ' );
			}

			if ( newNodeValue.indexOf( '  ' ) !== -1 ) {
				newNodeValue = newNodeValue.replace( / {2,}/g, ' ' );
			}

			if (
				i === 0 &&
				newNodeValue.startsWith( ' ' ) &&
				( isRoot || hasPrecedingSpace )
			) {
				newNodeValue = newNodeValue.slice( 1 );
			}
			if (
				i === nodes.length - 1 &&
				newNodeValue.endsWith( ' ' ) &&
				( isRoot || hasTrailingSpace )
			) {
				newNodeValue = newNodeValue.slice( 0, -1 );
			}

			node.nodeValue = newNodeValue;
		} else if ( node.nodeType === node.ELEMENT_NODE ) {
			const { previousSibling, nextSibling } = node;
			const prevHasSpace = previousSibling?.textContent!.endsWith( ' ' );
			const nextHasSpace = nextSibling?.textContent!.startsWith( ' ' );
			node.replaceWith(
				collapseWhiteSpace(
					node as HTMLElement,
					false,
					previousSibling
						? prevHasSpace
						: isRoot || hasPrecedingSpace,
					nextSibling ? nextHasSpace : isRoot || hasTrailingSpace
				)
			);
		}
	} );
	return clone;
}

/**
 * We need to normalise line breaks to `\n` so they are consistent across
 * platforms and serialised properly. Not removing \r would cause it to
 * linger and result in double line breaks when whitespace is preserved.
 */
const CARRIAGE_RETURN = '\r';

/**
 * Removes reserved characters used by rich-text (zero width non breaking spaces
 * added by `toTree` and object replacement characters).
 *
 * @param string
 */
export function removeReservedCharacters( string: string ) {
	// with the global flag, note that we should create a new regex each time OR
	// reset lastIndex state.
	return string.replace(
		new RegExp(
			`[${ ZWNBSP }${ OBJECT_REPLACEMENT_CHARACTER }${ CARRIAGE_RETURN }]`,
			'gu'
		),
		''
	);
}

/**
 * Creates a Rich Text value from a DOM element and range.
 *
 * @param options                  Named arguments.
 * @param [options.element]        Element to create value from.
 * @param [options.range]          Range to create value from.
 * @param [options.isEditableTree]
 *
 * @return A rich text value.
 */
function createFromElement( {
	element,
	range,
	isEditableTree,
}: {
	element?: Node;
	range?: SelectionRange | null;
	isEditableTree?: boolean;
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
		const tagName = node.nodeName.toLowerCase();

		if ( node.nodeType === node.TEXT_NODE ) {
			const text = removeReservedCharacters( node.nodeValue! );
			range = filterRange( node, range, removeReservedCharacters );
			accumulateSelection( accumulator, node, range, { text } );
			// Create a sparse array of the same length as `text`, in which
			// formats can be added.
			accumulator.formats.length += text.length;
			accumulator.replacements.length += text.length;
			accumulator.text += text;
			continue;
		}

		if (
			node.nodeType === node.COMMENT_NODE ||
			( node.nodeType === node.ELEMENT_NODE &&
				( node as Element ).tagName === 'SPAN' &&
				( node as Element ).hasAttribute( 'data-rich-text-comment' ) )
		) {
			const value = {
				formats: [ , ] as unknown as RichTextFormatList[],
				replacements: [
					{
						type: '#comment',
						attributes: {
							'data-rich-text-comment':
								node.nodeType === node.COMMENT_NODE
									? node.nodeValue!
									: ( node as Element ).getAttribute(
											'data-rich-text-comment'
										)!,
						},
					},
				],
				text: OBJECT_REPLACEMENT_CHARACTER,
			};
			accumulateSelection( accumulator, node, range, value );
			mergePair( accumulator, value );
			continue;
		}

		if ( node.nodeType !== node.ELEMENT_NODE ) {
			continue;
		}

		if (
			isEditableTree &&
			// Ignore any line breaks that are not inserted by us.
			tagName === 'br' &&
			! ( node as Element ).getAttribute( 'data-rich-text-line-break' )
		) {
			accumulateSelection( accumulator, node, range, createEmptyValue() );
			continue;
		}

		if ( tagName === 'script' ) {
			const value = {
				formats: [ , ] as unknown as RichTextFormatList[],
				replacements: [
					{
						type: tagName,
						attributes: {
							'data-rich-text-script':
								( node as Element ).getAttribute(
									'data-rich-text-script'
								) ||
								encodeURIComponent(
									( node as Element ).innerHTML
								),
						},
					},
				],
				text: OBJECT_REPLACEMENT_CHARACTER,
			};
			accumulateSelection( accumulator, node, range, value );
			mergePair( accumulator, value );
			continue;
		}

		if ( tagName === 'br' ) {
			accumulateSelection( accumulator, node, range, createEmptyValue() );
			mergePair( accumulator, create( { text: '\n' } ) );
			continue;
		}

		const format = toFormat( {
			tagName,
			attributes: getAttributes( { element: node as Element } ),
		} );

		// When a format type is declared as not editable, replace it with an
		// object replacement character and preserve the inner HTML.
		if ( format?.formatType?.contentEditable === false ) {
			delete format.formatType;
			accumulateSelection( accumulator, node, range, createEmptyValue() );
			mergePair( accumulator, {
				formats: [ , ] as unknown as RichTextFormatList[],
				replacements: [
					{
						...format,
						innerHTML: ( node as Element ).innerHTML,
					},
				],
				text: OBJECT_REPLACEMENT_CHARACTER,
			} );
			continue;
		}

		if ( format ) {
			delete format.formatType;
		}

		const value = createFromElement( {
			element: node,
			range,
			isEditableTree,
		} );

		accumulateSelection( accumulator, node, range, value );

		// Ignore any placeholders, but keep their content since the browser
		// might insert text inside them when the editable element is flex.
		if (
			! format ||
			( node as Element ).getAttribute( 'data-rich-text-placeholder' ) ||
			( node as Element ).getAttribute( 'data-rich-text-bogus' )
		) {
			mergePair( accumulator, value );
		} else if ( value.text.length === 0 ) {
			if ( format.attributes ) {
				mergePair( accumulator, {
					formats: [ , ] as unknown as RichTextFormatList[],
					replacements: [ format ],
					text: OBJECT_REPLACEMENT_CHARACTER,
				} );
			}
		} else {
			// Indices should share a reference to the same formats array.
			// Only create a new reference if `formats` changes.
			function mergeFormats( formats: ParsedFormat[] | undefined ) {
				if (
					( mergeFormats as { formats?: ParsedFormat[] } ).formats ===
					formats
				) {
					return mergeFormats.newFormats;
				}

				const newFormats = formats
					? [ format!, ...formats ]
					: [ format! ];

				( mergeFormats as { formats?: ParsedFormat[] } ).formats =
					formats;
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
 * Gets the attributes of an element in object shape.
 *
 * @param options         Named arguments.
 * @param options.element Element to get attributes from.
 *
 * @return Attribute object or `undefined` if the element has no attributes.
 */
function getAttributes( { element }: { element: Element } ) {
	if ( ! element.hasAttributes() ) {
		return;
	}

	const length = element.attributes.length;
	let accumulator: Record< string, string > | undefined;

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
