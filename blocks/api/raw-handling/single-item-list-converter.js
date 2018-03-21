/**
 * External dependencies
 */
import { includes } from 'lodash';

/**
 * Browser dependencies
 */
const { ELEMENT_NODE } = window.Node;

function isListRelated( node ) {
	return includes( [ 'UL', 'OL', 'LI' ], node.nodeName );
}

function isTopLevel( node ) {
	return (
		! node.parentNode ||
		node.parentNode.nodeName === 'BODY'
	);
}

export default function( node ) {
	// Only act at the root of the content and on a list with no siblings.
	if (
		node.nodeType !== ELEMENT_NODE ||
		! isTopLevel( node ) ||
		! node.childNodes ||
		node.childNodes.length !== 1 ||
		! isListRelated( node.firstChild )
	) {
		return;
	}

	const listType = node.nodeName;
	const isList = includes( [ 'UL', 'OL' ], listType );

	if ( ! isList ) {
		return;
	}

	// Flatten double lists, e.g.
	//   <ul><ul><li>…</li></ul></ul>
	// becomes
	//   <ul><li>…</li></ul>
	if (
		node.childNodes.length === 1 &&
		node.firstChild.nodeName === listType &&
		node.firstChild.childNodes.length === 1
	) {
		const nestedList = node.firstChild;
		while ( nestedList.hasChildNodes() ) {
			node.appendChild( nestedList.removeChild( nestedList.firstChild ) );
		}
		node.removeChild( nestedList );
	}

	// Convert single-item lists, e.g.
	//   <ul><li>Hello</li></ul>
	// becomes
	//   <p>Hello</p>
	if ( node.childNodes.length === 1 && node.firstChild.nodeName === 'LI' ) {
		// Create P node, transfer contents of LI to it.
		const singleListItem = node.firstChild;
		const paragraph = document.createElement( 'p' );
		while ( singleListItem.hasChildNodes() ) {
			paragraph.appendChild( singleListItem.removeChild( singleListItem.firstChild ) );
		}

		// Replace in body
		node.parentNode.replaceChild( paragraph, node );
	}
}
