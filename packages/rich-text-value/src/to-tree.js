/**
 * Internal dependencies
 */

import { split } from './split';

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
		getType,
		isText,
		getText,
		remove,
		appendText,
		onStartIndex,
		onEndIndex,
	} = settings;
	const { formats, text, start, end } = value;
	const formatsLength = formats.length + 1;
	const tree = createEmpty( tag );

	append( tree, '' );

	for ( let i = 0; i < formatsLength; i++ ) {
		const character = text.charAt( i );
		const characterFormats = formats[ i ];

		let pointer = getLastChild( tree );

		if ( characterFormats ) {
			characterFormats.forEach( ( { type, attributes, object } ) => {
				if ( pointer && type === getType( pointer ) ) {
					pointer = getLastChild( pointer );
					return;
				}

				const parent = getParent( pointer );
				const newNode = append( parent, { type, attributes, object } );

				if ( isText( pointer ) && getText( pointer ).length === 0 ) {
					remove( pointer );
				}

				pointer = append( object ? parent : newNode, '' );
			} );
		}

		if ( character !== '\ufffc' ) {
			if ( character === '\n' ) {
				pointer = append( getParent( pointer ), { type: 'br', object: true } );
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

	return tree;
}
