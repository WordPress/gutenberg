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

import { toObjectTree } from './to-object-tree';

/**
 * Create an HTML string from a Rich Text value. If a `multilineTag` is
 * provided, text separated by a line separator will be wrapped in it.
 *
 * @param {Object} $1                        Named argements.
 * @param {Object} $1.value                  Rich text value.
 * @param {string} [$1.multilineTag]         Multiline tag.
 *
 * @return {string} HTML string.
 */
export function toHTMLString( { value, multilineTag } ) {
	const tree = toObjectTree( { value, multilineTag } );
	return createChildrenHTML( tree.children );
}

function createElementHTML( { type, attributes, object, children } ) {
	let attributeString = '';

	for ( const key in attributes ) {
		if ( ! isValidAttributeName( key ) ) {
			continue;
		}

		attributeString += ` ${ key }="${ escapeAttribute( attributes[ key ] ) }"`;
	}

	if ( object ) {
		return `<${ type }${ attributeString }>`;
	}

	return `<${ type }${ attributeString }>${ createChildrenHTML( children ) }</${ type }>`;
}

function createChildrenHTML( children = [] ) {
	return children.map( ( child ) => {
		return child.text === undefined ? createElementHTML( child ) : escapeEditableHTML( child.text );
	} ).join( '' );
}
