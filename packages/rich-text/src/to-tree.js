/**
 * External dependencies
 */

import { find } from 'lodash';

/**
 * Internal dependencies
 */

import { split } from './split';
import { getFormatTypes } from './get-format-types';
import './store';

function fromFormat( { type, attributes, object } ) {
	const formatType = find( getFormatTypes(), ( { name } ) => type === name );

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
	if ( multilineTag ) {
		const { createEmpty, append } = settings;
		const tree = createEmpty();

		split( value, '\u2028' ).forEach( ( piece, index ) => {
			append( tree, toTree( piece, null, {
				...settings,
				tag: multilineTag,
				multilineIndex: index,
			} ) );
		} );

		return tree;
	}

	const {
		tag,
		multilineIndex,
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
		onEmpty,
	} = settings;
	const { formats, text, start, end } = value;
	const formatsLength = formats.length + 1;
	const tree = createEmpty( tag );

	append( tree, '' );

	for ( let i = 0; i < formatsLength; i++ ) {
		const character = text.charAt( i );
		const characterFormats = formats[ i ];
		const lastCharacterFormats = formats[ i - 1 ];

		let pointer = getLastChild( tree );

		if ( characterFormats ) {
			characterFormats.forEach( ( format, formatIndex ) => {
				if (
					pointer &&
					lastCharacterFormats &&
					format === lastCharacterFormats[ formatIndex ]
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

		// If there is selection at 0, handle it before characters are inserted.

		if ( onStartIndex && start === 0 && i === 0 ) {
			onStartIndex( tree, pointer, multilineIndex );
		}

		if ( onEndIndex && end === 0 && i === 0 ) {
			onEndIndex( tree, pointer, multilineIndex );
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
			onStartIndex( tree, pointer, multilineIndex );
		}

		if ( onEndIndex && end === i + 1 ) {
			onEndIndex( tree, pointer, multilineIndex );
		}
	}

	if ( onEmpty && text.length === 0 ) {
		onEmpty( tree );
	}

	return tree;
}
