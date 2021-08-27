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
	attributes,
	unregisteredAttributes,
	object,
	boundaryClass,
	isEditableTree,
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
		type: formatType.tagName,
		object: formatType.object,
		attributes: restoreOnAttributes( elementAttributes, isEditableTree ),
	};
}

export function toTree( {
	value,
	multilineTag,
	preserveWhiteSpace,
	createEmpty,
	append,
	getParent,
	createNewLine,
	onStartIndex,
	onEndIndex,
	isEditableTree,
	placeholder,
} ) {
	const { replacements, text, start, end, _formats } = value;
	const activeFormats = getActiveFormats( value );
	const deepestActiveFormat = activeFormats[ activeFormats.length - 1 ];

	const _tree = createEmpty();
	let _index = 0;
	let _pointer = _tree;
	const _maxLength = [];
	let lastMultilineFormats;

	if ( multilineTag ) _pointer = append( _tree, { type: multilineTag } );

	function _appendSplitText( _text, _start, _end ) {
		if ( _text === OBJECT_REPLACEMENT_CHARACTER ) {
			if (
				! isEditableTree &&
				replacements[ _start ]?.type === 'script'
			) {
				// pointer = append(
				// 	getParent( pointer ),
				// 	fromFormat( {
				// 		type: 'script',
				// 		isEditableTree,
				// 	} )
				// );
				// append( pointer, {
				// 	html: decodeURIComponent(
				// 		replacements[ i ].attributes[ 'data-rich-text-script' ]
				// 	),
				// } );
			} else {
				_text = fromFormat( {
					...replacements[ _start ],
					object: true,
					isEditableTree,
				} );
			}
		} else if ( _text === '\n' && ! preserveWhiteSpace ) {
			_text = {
				type: 'br',
				attributes: isEditableTree
					? {
							'data-rich-text-line-break': 'true',
					  }
					: undefined,
				object: true,
			};
		} else if ( _text === LINE_SEPARATOR ) {
			if ( isEditableTree ) {
				const padding = append( _pointer, ZWNBSP );

				if ( start === _start ) {
					onStartIndex( _tree, padding, [ 0 ] );
				}

				if ( end === _start ) {
					onEndIndex( _tree, padding, [ 0 ] );
				}
			}

			let diff =
				( replacements[ _start ] || [] ).length -
				( lastMultilineFormats || [] ).length;

			if ( diff === 0 ) {
				_pointer = createNewLine( _pointer, multilineTag );
			} else if ( diff > 0 ) {
				_pointer = append(
					_pointer,
					replacements[ _start ][ replacements[ _start ].length - 1 ]
				);
				_pointer = append( _pointer, { type: multilineTag } );
			} else if ( diff < 0 ) {
				// Point to the list container.
				_pointer = getParent( _pointer );

				while ( diff++ ) {
					// Point to the list item.
					_pointer = getParent( _pointer );
					// Point to the list container.
					_pointer = getParent( _pointer );
				}

				_pointer = append( _pointer, { type: multilineTag } );
			}

			lastMultilineFormats = replacements[ _start ];
			return;
		}

		const node = append( _pointer, _text );

		if ( isEditableTree ) {
			if ( onStartIndex && start >= _start && start <= _end ) {
				onStartIndex(
					_tree,
					node,
					typeof _text === 'string' ? [ start - _start ] : []
				);
			}

			if ( onEndIndex && end >= _start && end <= _end ) {
				onEndIndex(
					_tree,
					node,
					typeof _text === 'string' ? [ end - _start ] : []
				);
			}
		}
	}

	function _appendText( _start, _end ) {
		const _text = text.slice( _start, _end );

		if ( ! _text ) {
			return;
		}

		let remainingText = '';
		let i;

		for ( i = 0; i < _text.length; i++ ) {
			const letter = _text[ i ];
			if (
				letter === '\n' ||
				letter === OBJECT_REPLACEMENT_CHARACTER ||
				letter === LINE_SEPARATOR
			) {
				if ( remainingText ) {
					_appendSplitText(
						remainingText,
						_start + i - remainingText.length,
						_start + i
					);
				}
				_appendSplitText( letter, _start + i, _start + i + 1 );
				remainingText = '';
			} else {
				remainingText += letter;
			}
		}

		if ( remainingText ) {
			_appendSplitText(
				remainingText,
				_start + i - remainingText.length,
				_start + i
			);
		}
	}

	function _fillText( untilIndex ) {
		let _maxLengths = _maxLength.length;

		while ( _maxLengths-- ) {
			if ( untilIndex >= _maxLength[ _maxLengths ] ) {
				const index = _maxLength.pop();
				_appendText( _index, index );
				_pointer = getParent( _pointer );
				_index = index;
			} else {
				break;
			}
		}

		_appendText( _index, untilIndex );
	}

	for ( const [ format, [ _start, _end ] ] of _formats.entries() ) {
		_fillText( _start );

		const boundaryClass = isEditableTree && format === deepestActiveFormat;

		_pointer = append(
			_pointer,
			fromFormat( { ...format, boundaryClass, isEditableTree } )
		);
		_index = _start;
		_maxLength.push( _end );
	}

	_fillText( text.length );

	if ( ! isEditableTree ) {
		return _tree;
	}

	const padding = append( _pointer, ZWNBSP );

	if ( text.length === 0 || !! multilineTag ) {
		if ( start === text.length ) {
			onStartIndex( _tree, padding, [ 0 ] );
		}

		if ( end === text.length ) {
			onEndIndex( _tree, padding, [ 0 ] );
		}
	}

	if ( placeholder && text.length === 0 ) {
		append( getParent( padding ), {
			type: 'span',
			attributes: {
				'data-rich-text-placeholder': placeholder,
				// Necessary to prevent the placeholder from catching
				// selection. The placeholder is also not editable after
				// all.
				contenteditable: 'false',
				style:
					'pointer-events:none;user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;',
			},
		} );
	}

	return _tree;
}
