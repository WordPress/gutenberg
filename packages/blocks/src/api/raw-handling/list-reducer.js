/**
 * WordPress dependencies
 */
import { unwrap } from '@wordpress/dom';

function isList( node ) {
	return node.nodeName === 'OL' || node.nodeName === 'UL';
}

function shallowTextContent( element ) {
	return Array.from( element.childNodes )
		.map( ( { nodeValue = '' } ) => nodeValue )
		.join( '' );
}

export default function listReducer( node ) {
	if ( ! isList( node ) ) {
		return;
	}

	const list = node;
	const prevElement = node.previousElementSibling;

	// Merge with previous list if:
	// * There is a previous list of the same type.
	// * There is only one list item.
	if (
		prevElement &&
		prevElement.nodeName === node.nodeName &&
		list.children.length === 1
	) {
		// Move all child nodes, including any text nodes, if any.
		while ( list.firstChild ) {
			prevElement.appendChild( list.firstChild );
		}

		list.parentNode.removeChild( list );
	}

	const parentElement = node.parentNode;

	// Nested list with empty parent item.
	if (
		parentElement &&
		parentElement.nodeName === 'LI' &&
		parentElement.children.length === 1 &&
		! /\S/.test( shallowTextContent( parentElement ) )
	) {
		const parentListItem = parentElement;
		const prevListItem = parentListItem.previousElementSibling;
		const parentList = parentListItem.parentNode;

		if ( prevListItem ) {
			prevListItem.appendChild( list );
			parentList.removeChild( parentListItem );
		}
	}

	// Invalid: OL/UL > OL/UL.
	if ( parentElement && isList( parentElement ) ) {
		const prevListItem = node.previousElementSibling;

		if ( prevListItem ) {
			prevListItem.appendChild( node );
		} else {
			unwrap( node );
		}
	}
}
