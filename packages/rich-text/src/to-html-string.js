/**
 * WordPress dependencies
 */

import {
	escapeEditableHTML,
	escapeAttribute,
	isValidAttributeName,
} from '@wordpress/escape-html';

/**
 * Internal dependencies
 */

import { toTree } from './to-tree';

/** @typedef {import('./types').RichTextValue} RichTextValue */

/**
 * Create an HTML string from a Rich Text value.
 *
 * @param {Object}        $1                      Named arguments.
 * @param {RichTextValue} $1.value                Rich text value.
 * @param {boolean}       [$1.preserveWhiteSpace] Preserves newlines if true.
 *
 * @return {string} HTML string.
 */
export function toHTMLString( { value, preserveWhiteSpace } ) {
	const tree = toTree( {
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
	} );

	return createChildrenHTML( tree.children );
}

function createEmpty() {
	return {};
}

function getLastChild( { children } ) {
	return children && children[ children.length - 1 ];
}

function append( parent, object ) {
	if ( typeof object === 'string' ) {
		object = { text: object };
	}

	object.parent = parent;
	parent.children = parent.children || [];
	parent.children.push( object );
	return object;
}

function appendText( object, text ) {
	object.text += text;
}

function getParent( { parent } ) {
	return parent;
}

function isText( { text } ) {
	return typeof text === 'string';
}

function getText( { text } ) {
	return text;
}

function remove( object ) {
	const index = object.parent.children.indexOf( object );

	if ( index !== -1 ) {
		object.parent.children.splice( index, 1 );
	}

	return object;
}

function createElementHTML( { type, attributes, object, children } ) {
	if ( type === '#comment' ) {
		// We can't restore the original comment delimiters, because once parsed
		// into DOM nodes, we don't have the information. But in the future we
		// could allow comment handlers to specify custom delimiters, for
		// example `</{comment-content}>` for Bits, where `comment-content`
		// would be `/{bit-name}` or `__{translatable-string}` (TBD).
		return `<!--${ attributes[ 'data-rich-text-comment' ] }-->`;
	}

	let attributeString = '';

	for ( const key in attributes ) {
		if ( ! isValidAttributeName( key ) ) {
			continue;
		}

		attributeString += ` ${ key }="${ escapeAttribute(
			attributes[ key ]
		) }"`;
	}

	if ( object ) {
		return `<${ type }${ attributeString }>`;
	}

	return `<${ type }${ attributeString }>${ createChildrenHTML(
		children
	) }</${ type }>`;
}

function createChildrenHTML( children = [] ) {
	return children
		.map( ( child ) => {
			if ( child.html !== undefined ) {
				return child.html;
			}

			return child.text === undefined
				? createElementHTML( child )
				: escapeEditableHTML( child.text );
		} )
		.join( '' );
}
