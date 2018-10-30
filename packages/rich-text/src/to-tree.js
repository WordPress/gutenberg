/**
 * Internal dependencies
 */

import { getFormatType } from './get-format-type';
import {
	LINE_SEPARATOR,
	OBJECT_REPLACEMENT_CHARACTER,
	ZERO_WIDTH_NO_BREAK_SPACE,
} from './special-characters';

function fromFormat( { type, attributes, object } ) {
	const formatType = getFormatType( type );

	if ( ! formatType ) {
		return { type, attributes, object };
	}

	if ( ! attributes ) {
		return {
			type: formatType.match.tagName,
			object: formatType.object,
		};
	}

	const elementAttributes = {};

	for ( const name in attributes ) {
		const key = formatType.attributes[ name ];

		if ( key ) {
			elementAttributes[ key ] = attributes[ name ];
		} else {
			elementAttributes[ name ] = attributes[ name ];
		}
	}

	return {
		type: formatType.match.tagName,
		object: formatType.object,
		attributes: elementAttributes,
	};
}

export function toTree( {
	value,
	multilineTag,
	multilineWrapperTags,
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
	const { formats, text, start, end, formatPlaceholder } = value;
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

				const { type, attributes, object } = format;
				const parent = getParent( pointer );
				const newNode = append( parent, fromFormat( { type, attributes, object } ) );

				if ( isText( pointer ) && getText( pointer ).length === 0 ) {
					remove( pointer );
				}

				pointer = append( object ? parent : newNode, '' );
			} );
		}

		// No need for further processing if the character is a line separator.
		if ( character === LINE_SEPARATOR ) {
			lastCharacterFormats = characterFormats;
			lastCharacter = character;
			continue;
		}

		if ( isEditableTree && formatPlaceholder && formatPlaceholder.index === 0 ) {
			const parent = getParent( pointer );

			if ( formatPlaceholder.format === undefined ) {
				pointer = getParent( parent );
			} else {
				pointer = append( parent, fromFormat( formatPlaceholder.format ) );
			}

			pointer = append( pointer, ZERO_WIDTH_NO_BREAK_SPACE );
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

		if ( character !== OBJECT_REPLACEMENT_CHARACTER ) {
			if ( character === '\n' ) {
				pointer = append( getParent( pointer ), { type: 'br', object: true } );
				// Ensure pointer is text node.
				pointer = append( getParent( pointer ), '' );
			} else if ( ! isText( pointer ) ) {
				pointer = append( getParent( pointer ), character );
			} else {
				appendText( pointer, character );
			}
		}

		if ( isEditableTree && formatPlaceholder && formatPlaceholder.index === i + 1 ) {
			const parent = getParent( pointer );

			if ( formatPlaceholder.format === undefined ) {
				pointer = getParent( parent );
			} else {
				pointer = append( parent, fromFormat( formatPlaceholder.format ) );
			}

			pointer = append( pointer, ZERO_WIDTH_NO_BREAK_SPACE );
		}

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
