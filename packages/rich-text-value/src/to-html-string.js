/**
 * Internal dependencies
 */

import { escapeHTML, escapeAttribute } from '@wordpress/escape-html';

/**
 * Internal dependencies
 */

import { split } from './split';

/**
 * Create an HTML string from a Rich Text value. If a `multilineTag` is
 * provided, text separated by two new lines will be wrapped in it.
 *
 * @param {Object} value        Rich text value.
 * @param {string} multilineTag Multiline tag.
 *
 * @return {string} HTML string.
 */
export function toHTMLString( value, multilineTag ) {
	if ( multilineTag ) {
		return split( value, '\n\n' ).map( ( line ) =>
			`<${ multilineTag }>${ toHTMLString( line ) }</${ multilineTag }>`
		).join( '' );
	}

	const { formats, text } = value;
	const formatsLength = formats.length + 1;
	const tree = {};

	append( tree, { text: '' } );

	for ( let i = 0; i < formatsLength; i++ ) {
		const character = text.charAt( i );
		const characterFormats = formats[ i ];

		let pointer = getLastChild( tree );

		if ( characterFormats ) {
			characterFormats.forEach( ( { type, attributes, object } ) => {
				if ( pointer && type === pointer.type ) {
					pointer = getLastChild( pointer );
					return;
				}

				const newNode = { type, attributes, object };
				append( pointer.parent, newNode );
				pointer = append( object ? pointer.parent : newNode, { text: '' } );
			} );
		}

		if ( character !== '\ufffc' ) {
			if ( character === '\n' ) {
				pointer = append( pointer.parent, { type: 'br', object: true } );
			} else if ( pointer.text === undefined ) {
				pointer = append( pointer.parent, { text: character } );
			} else {
				pointer.text += character;
			}
		}
	}

	return createChildrenHTML( tree.children );
}

function getLastChild( { children } ) {
	return children && children[ children.length - 1 ];
}

function append( parent, object ) {
	object.parent = parent;
	parent.children = parent.children || [];
	parent.children.push( object );
	return object;
}

function createElementHTML( { type, attributes, object, children } ) {
	let attributeString = '';

	for ( const key in attributes ) {
		attributeString += ` ${ key }="${ escapeAttribute( attributes[ key ] ) }"`;
	}

	if ( object ) {
		return `<${ type }${ attributeString }>`;
	}

	return `<${ type }${ attributeString }>${ createChildrenHTML( children ) }</${ type }>`;
}

function createChildrenHTML( children = [] ) {
	return children.map( ( child ) => {
		return child.text === undefined ? createElementHTML( child ) : escapeHTML( child.text );
	} ).join( '' );
}
