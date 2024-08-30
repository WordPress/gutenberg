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

	// When a format is declared as non editable, make it non editable in the
	// editor.
	if ( isEditableTree && formatType.contentEditable === false ) {
		elementAttributes.contenteditable = 'false';
	}

	return {
		type: tagName || formatType.tagName,
		object: formatType.object,
		attributes: restoreOnAttributes( elementAttributes, isEditableTree ),
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
	const activeFormats = getActiveFormats( value );
	const deepestActiveFormat = activeFormats[ activeFormats.length - 1 ];

	let lastCharacterFormats;
	let lastCharacter;

	append( tree, '' );

	for ( let i = 0; i < formatsLength; i++ ) {
		const character = text.charAt( i );
		const shouldInsertPadding =
			isEditableTree &&
			// Pad the line if the line is empty.
			( ! lastCharacter ||
				// Pad the line if the previous character is a line break, otherwise
				// the line break won't be visible.
				lastCharacter === '\n' );

		const characterFormats = formats[ i ];
		let pointer = getLastChild( tree );

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
					)
				) {
					pointer = getLastChild( pointer );
					return;
				}

				const { type, tagName, attributes, unregisteredAttributes } =
					format;

				const boundaryClass =
					isEditableTree && format === deepestActiveFormat;

				const parent = getParent( pointer );
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
			} );
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
			const replacement = replacements[ i ];
			if ( ! replacement ) {
				continue;
			}
			const { type, attributes, innerHTML } = replacement;
			const formatType = getFormatType( type );

			if ( ! isEditableTree && type === 'script' ) {
				pointer = append(
					getParent( pointer ),
					fromFormat( {
						type: 'script',
						isEditableTree,
					} )
				);
				append( pointer, {
					html: decodeURIComponent(
						attributes[ 'data-rich-text-script' ]
					),
				} );
			} else if ( formatType?.contentEditable === false ) {
				// For non editable formats, render the stored inner HTML.
				pointer = append(
					getParent( pointer ),
					fromFormat( {
						...replacement,
						isEditableTree,
						boundaryClass: start === i && end === i + 1,
					} )
				);

				if ( innerHTML ) {
					append( pointer, {
						html: innerHTML,
					} );
				}
			} else {
				pointer = append(
					getParent( pointer ),
					fromFormat( {
						...replacement,
						object: true,
						isEditableTree,
					} )
				);
			}
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
						// selection and being editable.
						style: 'pointer-events:none;user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;',
					},
				} );
			}
		}

		lastCharacterFormats = characterFormats;
		lastCharacter = character;
	}

	return tree;
}
