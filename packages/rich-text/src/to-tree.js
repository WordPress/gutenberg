/**
 * Internal dependencies
 */

import { getFormatType } from './get-format-type';
import {
	LINE_SEPARATOR,
	OBJECT_REPLACEMENT_CHARACTER,
	ZERO_WIDTH_NO_BREAK_SPACE,
} from './special-characters';

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

function fromFormat( { type, attributes, unregisteredAttributes, object, isEditableTree } ) {
	const formatType = getFormatType( type );

	if ( ! formatType ) {
 		return {
 			type,
 			attributes: restoreOnAttributes(
 				attributes,
 				isEditableTree
 			),
 			object,
 		};
 	}

	const elementAttributes = { ...unregisteredAttributes };

	for ( const name in attributes ) {
		const key = formatType.attributes[ name ];

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
		attributes: restoreOnAttributes( elementAttributes, isEditableTree ),
	};
}

export function toTree( {
	value,
	multilineTag,
	multilineWrapperTags = [],
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
} ) {
	const { formats, text, start, end, formatPlaceholder, replacements } = value;
	const formatsLength = formats.length + 1;
	const tree = createEmpty();
	const multilineFormat = { type: multilineTag };

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

	function setFormatPlaceholder( pointer, index ) {
		if ( isEditableTree && formatPlaceholder && formatPlaceholder.index === index ) {
			const parent = getParent( pointer );

			if ( formatPlaceholder.format === undefined ) {
				pointer = getParent( parent );
			} else {
				pointer = append( parent, fromFormat( formatPlaceholder.format ) );
			}

			pointer = append( pointer, ZERO_WIDTH_NO_BREAK_SPACE );
		}

		return pointer;
	}

	for ( let i = 0; i < formatsLength; i++ ) {
		const character = text.charAt( i );
		let characterFormats = formats[ i ];

		// Set multiline tags in queue for building the tree.
		if ( multilineTag ) {
			if ( character === LINE_SEPARATOR ) {
				characterFormats = lastSeparatorFormats = ( characterFormats || [] ).reduce( ( accumulator, format ) => {
					if ( character === LINE_SEPARATOR && multilineWrapperTags.indexOf( format.type ) !== -1 ) {
						accumulator.push( format );
						accumulator.push( multilineFormat );
					}

					return accumulator;
				}, [ multilineFormat ] );
			} else {
				characterFormats = [ ...lastSeparatorFormats, ...( characterFormats || [] ) ];
			}
		}

		let pointer = getLastChild( tree );

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
					format === lastCharacterFormats[ formatIndex ] &&
					// Do not reuse the last element if the character is a
					// line separator.
					( character !== LINE_SEPARATOR ||
						characterFormats.length - 1 !== formatIndex )
				) {
					pointer = getLastChild( pointer );
					return;
				}

				const parent = getParent( pointer );
				const { type, attributes, unregisteredAttributes } = format;
				const newNode = append( parent, fromFormat( {
					type,
					attributes,
					unregisteredAttributes,
					isEditableTree,
				} ) );

				if ( isText( pointer ) && getText( pointer ).length === 0 ) {
					remove( pointer );
				}

				pointer = append( format.object ? parent : newNode, '' );
			} );
		}

		// No need for further processing if the character is a line separator.
		if ( character === LINE_SEPARATOR ) {
			lastCharacterFormats = characterFormats;
			lastCharacter = character;
			continue;
		}

		pointer = setFormatPlaceholder( pointer, 0 );

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
			if ( ! isEditableTree && replacements[ i ].type === 'script' ) {
				pointer = append(
					getParent( pointer ),
					fromFormat( {
						type: 'script',
						isEditableTree,
					} )
				);
				append( pointer, {
					html: decodeURIComponent(
						replacements[ i ].attributes[ 'data-rich-text-script' ]
					),
				} );
			} else {
				pointer = append(
					getParent( pointer ),
					fromFormat( {
						...replacements[ i ],
						object: true,
						isEditableTree,
					} )
				);
			}
			// Ensure pointer is text node.
			pointer = append( getParent( pointer ), '' );
		} else if ( character === '\n' ) {
			pointer = append( getParent( pointer ), { type: 'br', object: true } );
			// Ensure pointer is text node.
			pointer = append( getParent( pointer ), '' );
		} else if ( ! isText( pointer ) ) {
			pointer = append( getParent( pointer ), character );
		} else {
			appendText( pointer, character );
		}

		pointer = setFormatPlaceholder( pointer, i + 1 );

		if ( onStartIndex && start === i + 1 ) {
			onStartIndex( tree, pointer );
		}

		if ( onEndIndex && end === i + 1 ) {
			onEndIndex( tree, pointer );
		}

		lastCharacterFormats = characterFormats;
		lastCharacter = character;
	}

	return tree;
}
