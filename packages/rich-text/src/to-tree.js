/**
 * Internal dependencies
 */

import { split } from './split';
import { getFormatType } from './get-format-type';

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

export function toTree( value, multilineTag, settings ) {
	const {
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
	} = settings;
	const { formats, text, start, end } = value;
	const formatsLength = formats.length + 1;
	const tree = createEmpty();
	const multilineFormat = { type: multilineTag };

	let lastCharacterFormats;
	let lastCharacter;

	// If we're building a multiline tree, start off with a multiline element.
	if ( multilineTag ) {
		append( append( tree, { type: multilineTag } ), '' );
		lastCharacterFormats = [ multilineFormat ];
	} else {
		append( tree, '' );
	}

	for ( let i = 0; i < formatsLength; i++ ) {
		const character = text.charAt( i );
		let characterFormats = formats[ i ];

		// Set multiline tags in queue for building the tree.
		// For list items we need to take into account nested list items.
		if ( multilineTag === 'li' ) {
			characterFormats = ( characterFormats || [] ).reduce( ( accumulator, format ) => {
				accumulator.push( format );

				if ( format.type === 'ol' || format.type === 'ul' ) {
					accumulator.push( multilineFormat );
				}

				return accumulator;
			}, [ multilineFormat ] );
		} else if ( multilineTag ) {
			characterFormats = [ multilineFormat, ...( characterFormats || [] ) ];
		}

		let pointer = getLastChild( tree );

		// Set selection for the start of line.
		if ( lastCharacter === '\u2028' ) {
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
					( character !== '\u2028' ||
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
		if ( character === '\u2028' ) {
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

		if ( character !== '\ufffc' ) {
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
