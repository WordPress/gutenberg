/**
 * Internal dependencies
 */

import { getActiveFormats } from './get-active-formats';
import { getFormatType } from './get-format-type';
import {
	LINE_SEPARATOR,
	OBJECT_REPLACEMENT_CHARACTER,
	ZWNBSP,
} from './special-characters';

/**
 * Converts a format object to information that can be used to create an element
 * from (type, attributes and object).
 *
 * @param  {Object}  $1                        Named parameters.
 * @param  {string}  $1.type                   The format type.
 * @param  {Object}  $1.attributes             The format attributes.
 * @param  {Object}  $1.unregisteredAttributes The unregistered format
 *                                             attributes.
 * @param  {boolean} $1.object                 Wether or not it is an object
 *                                             format.
 * @param  {boolean} $1.boundaryClass          Wether or not to apply a boundary
 *                                             class.
 * @return {Object}                            Information to be used for
 *                                             element creation.
 */
function fromFormat( {
	type,
	attributes,
	unregisteredAttributes,
	object,
	boundaryClass,
} ) {
	const formatType = getFormatType( type );

	let elementAttributes = {};

	if ( boundaryClass ) {
		elementAttributes[ 'data-rich-text-format-boundary' ] = 'true';
	}

	if ( ! formatType ) {
		if ( attributes ) {
			elementAttributes = { ...attributes, ...elementAttributes };
		}

		return { type, attributes: elementAttributes, object };
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
		type: formatType.tagName,
		object: formatType.object,
		attributes: elementAttributes,
	};
}

/**
 * Checks if both arrays of formats up until a certain index are equal.
 *
 * @param {Array}  a     Array of formats to compare.
 * @param {Array}  b     Array of formats to compare.
 * @param {number} index Index to check until.
 */
function isEqualUntil( a, b, index ) {
	do {
		if ( a[ index ] !== b[ index ] ) {
			return false;
		}
	} while ( index-- );

	return true;
}

export function toTree( {
	value,
	multilineTag,
	preserveWhiteSpace,
	createEmpty,
	append,
	getLastChild,
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
	const { formats, replacements, text, start, end } = value;
	const formatsLength = formats.length + 1;
	const tree = createEmpty();
	const multilineFormat = { type: multilineTag };
	const activeFormats = getActiveFormats( value );
	const deepestActiveFormat = activeFormats[ activeFormats.length - 1 ];

	let lastSeparatorFormats;
	let lastCharacterFormats;
	let lastCharacter;

	// If we're building a multiline tree, start off with a multiline element.
	if ( multilineTag ) {
		append( append( tree, { type: multilineTag } ), '' );
		lastCharacterFormats = lastSeparatorFormats = [ multilineFormat ];
	} else {
		append( tree, '' );
	}

	for ( let i = 0; i < formatsLength; i++ ) {
		const character = text.charAt( i );
		const shouldInsertPadding =
			isEditableTree &&
			// Pad the line if the line is empty.
			( ! lastCharacter ||
				lastCharacter === LINE_SEPARATOR ||
				// Pad the line if the previous character is a line break, otherwise
				// the line break won't be visible.
				lastCharacter === '\n' );

		let characterFormats = formats[ i ];

		// Set multiline tags in queue for building the tree.
		if ( multilineTag ) {
			if ( character === LINE_SEPARATOR ) {
				characterFormats = lastSeparatorFormats = (
					replacements[ i ] || []
				).reduce(
					( accumulator, format ) => {
						accumulator.push( format, multilineFormat );
						return accumulator;
					},
					[ multilineFormat ]
				);
			} else {
				characterFormats = [
					...lastSeparatorFormats,
					...( characterFormats || [] ),
				];
			}
		}

		let pointer = getLastChild( tree );

		if ( shouldInsertPadding && character === LINE_SEPARATOR ) {
			let node = pointer;

			while ( ! isText( node ) ) {
				node = getLastChild( node );
			}

			append( getParent( node ), ZWNBSP );
		}

		// Set selection for the start of line.
		if ( lastCharacter === LINE_SEPARATOR ) {
			let node = pointer;

			while ( ! isText( node ) ) {
				node = getLastChild( node );
			}

			if ( onStartIndex && start === i ) {
				onStartIndex( tree, node );
			}

			if ( onEndIndex && end === i ) {
				onEndIndex( tree, node );
			}
		}

		if ( characterFormats ) {
			characterFormats.forEach( ( format, formatIndex ) => {
				if (
					pointer &&
					lastCharacterFormats &&
					// Reuse the last element if all formats remain the same.
					isEqualUntil(
						characterFormats,
						lastCharacterFormats,
						formatIndex
					) &&
					// Do not reuse the last element if the character is a
					// line separator.
					( character !== LINE_SEPARATOR ||
						characterFormats.length - 1 !== formatIndex )
				) {
					pointer = getLastChild( pointer );
					return;
				}

				const { type, attributes, unregisteredAttributes } = format;

				const boundaryClass =
					isEditableTree &&
					character !== LINE_SEPARATOR &&
					format === deepestActiveFormat;

				const parent = getParent( pointer );
				const newNode = append(
					parent,
					fromFormat( {
						type,
						attributes,
						unregisteredAttributes,
						boundaryClass,
					} )
				);

				if ( isText( pointer ) && getText( pointer ).length === 0 ) {
					remove( pointer );
				}

				pointer = append( newNode, '' );
			} );
		}

		// No need for further processing if the character is a line separator.
		if ( character === LINE_SEPARATOR ) {
			lastCharacterFormats = characterFormats;
			lastCharacter = character;
			continue;
		}

		// If there is selection at 0, handle it before characters are inserted.
		if ( i === 0 ) {
			if ( onStartIndex && start === 0 ) {
				onStartIndex( tree, pointer );
			}

			if ( onEndIndex && end === 0 ) {
				onEndIndex( tree, pointer );
			}
		}

		if ( character === OBJECT_REPLACEMENT_CHARACTER ) {
			pointer = append(
				getParent( pointer ),
				fromFormat( {
					...replacements[ i ],
					object: true,
				} )
			);
			// Ensure pointer is text node.
			pointer = append( getParent( pointer ), '' );
		} else if ( ! preserveWhiteSpace && character === '\n' ) {
			pointer = append( getParent( pointer ), {
				type: 'br',
				attributes: isEditableTree
					? {
							'data-rich-text-line-break': 'true',
					  }
					: undefined,
				object: true,
			} );
			// Ensure pointer is text node.
			pointer = append( getParent( pointer ), '' );
		} else if ( ! isText( pointer ) ) {
			pointer = append( getParent( pointer ), character );
		} else {
			appendText( pointer, character );
		}

		if ( onStartIndex && start === i + 1 ) {
			onStartIndex( tree, pointer );
		}

		if ( onEndIndex && end === i + 1 ) {
			onEndIndex( tree, pointer );
		}

		if ( shouldInsertPadding && i === text.length ) {
			append( getParent( pointer ), ZWNBSP );

			if ( placeholder && text.length === 0 ) {
				append( getParent( pointer ), {
					type: 'span',
					attributes: {
						'data-rich-text-placeholder': placeholder,
						// Necessary to prevent the placeholder from catching
						// selection. The placeholder is also not editable after
						// all.
						contenteditable: 'false',
					},
				} );
			}
		}

		lastCharacterFormats = characterFormats;
		lastCharacter = character;
	}

	return tree;
}
