/**
 * Browser dependencies
 */
const { ELEMENT_NODE } = window.Node;

function shallowTextContent( element ) {
	return [ ...element.childNodes ]
		.map( ( { nodeValue = '' } ) => nodeValue )
		.join( '' );
}

export default function( node ) {
	if ( node.nodeType !== ELEMENT_NODE ) {
		return;
	}

	const type = node.nodeName;

	if ( type !== 'OL' && type !== 'UL' ) {
		return;
	}

	const list = node;
	const prevElement = node.previousElementSibling;

	// Merge with previous list if:
	// * There is a previous list of the same type.
	// * There is only one list item.
	if (
		prevElement &&
		prevElement.nodeName === type &&
		list.children.length === 1
	) {
		prevElement.appendChild( list.firstChild );
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
		} else {
			parentList.parentNode.insertBefore( list, parentList );
			parentList.parentNode.removeChild( parentList );
		}
	}
}
