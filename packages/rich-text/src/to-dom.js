/**
 * Internal dependencies
 */

import { toTree } from './to-tree';
import { createElement } from './create-element';

/** @typedef {import('./create').RichTextValue} RichTextValue */

/**
 * Creates a path as an array of indices from the given root node to the given
 * node.
 *
 * @param {Node}        node     Node to find the path of.
 * @param {HTMLElement} rootNode Root node to find the path from.
 * @param {Array}       path     Initial path to build on.
 *
 * @return {Array} The path from the root node to the node.
 */
function createPathToNode( node, rootNode, path ) {
	const parentNode = node.parentNode;
	let i = 0;

	while ( ( node = node.previousSibling ) ) {
		i++;
	}

	path = [ i, ...path ];

	if ( parentNode !== rootNode ) {
		path = createPathToNode( parentNode, rootNode, path );
	}

	return path;
}

/**
 * Gets a node given a path (array of indices) from the given node.
 *
 * @param {HTMLElement} node Root node to find the wanted node in.
 * @param {Array}       path Path (indices) to the wanted node.
 *
 * @return {Object} Object with the found node and the remaining offset (if any).
 */
function getNodeByPath( node, path ) {
	path = [ ...path ];

	while ( node && path.length > 1 ) {
		node = node.childNodes[ path.shift() ];
	}

	return {
		node,
		offset: path[ 0 ],
	};
}

function append( element, child ) {
	if ( typeof child === 'string' ) {
		child = element.ownerDocument.createTextNode( child );
	}

	const { type, attributes } = child;

	if ( type ) {
		child = element.ownerDocument.createElement( type );

		for ( const key in attributes ) {
			child.setAttribute( key, attributes[ key ] );
		}
	}

	return element.appendChild( child );
}

function appendText( node, text ) {
	node.appendData( text );
}

function getLastChild( { lastChild } ) {
	return lastChild;
}

function getParent( { parentNode } ) {
	return parentNode;
}

function isText( node ) {
	return node.nodeType === node.TEXT_NODE;
}

function getText( { nodeValue } ) {
	return nodeValue;
}

function remove( node ) {
	return node.parentNode.removeChild( node );
}

export function toDom( {
	value,
	multilineTag,
	prepareEditableTree,
	isEditableTree = true,
	placeholder,
	doc = document,
} ) {
	let startPath = [];
	let endPath = [];

	if ( prepareEditableTree ) {
		value = {
			...value,
			formats: prepareEditableTree( value ),
		};
	}

	/**
	 * Returns a new instance of a DOM tree upon which RichText operations can be
	 * applied.
	 *
	 * Note: The current implementation will return a shared reference, reset on
	 * each call to `createEmpty`. Therefore, you should not hold a reference to
	 * the value to operate upon asynchronously, as it may have unexpected results.
	 *
	 * @return {Object} RichText tree.
	 */
	const createEmpty = () => createElement( doc, '' );

	const tree = toTree( {
		value,
		multilineTag,
		createEmpty,
		append,
		getLastChild,
		getParent,
		isText,
		getText,
		remove,
		appendText,
		onStartIndex( body, pointer ) {
			startPath = createPathToNode( pointer, body, [
				pointer.nodeValue.length,
			] );
		},
		onEndIndex( body, pointer ) {
			endPath = createPathToNode( pointer, body, [
				pointer.nodeValue.length,
			] );
		},
		isEditableTree,
		placeholder,
	} );

	return {
		body: tree,
		selection: { startPath, endPath },
	};
}

/**
 * Returns true if two ranges are equal, or false otherwise. Ranges are
 * considered equal if their start and end occur in the same container and
 * offset.
 *
 * @param {Range} a First range object to test.
 * @param {Range} b First range object to test.
 *
 * @return {boolean} Whether the two ranges are equal.
 */
function isRangeEqual( a, b ) {
	return (
		a.startContainer === b.startContainer &&
		a.startOffset === b.startOffset &&
		a.endContainer === b.endContainer &&
		a.endOffset === b.endOffset
	);
}

export function applySelection( { startPath, endPath }, current ) {
	const { node: startContainer, offset: startOffset } = getNodeByPath(
		current,
		startPath
	);
	const { node: endContainer, offset: endOffset } = getNodeByPath(
		current,
		endPath
	);
	const { ownerDocument } = current;
	const { defaultView } = ownerDocument;
	const selection = defaultView.getSelection();
	const range = ownerDocument.createRange();

	range.setStart( startContainer, startOffset );
	range.setEnd( endContainer, endOffset );

	const { activeElement } = ownerDocument;

	if ( selection.rangeCount > 0 ) {
		// If the to be added range and the live range are the same, there's no
		// need to remove the live range and add the equivalent range.
		if ( isRangeEqual( range, selection.getRangeAt( 0 ) ) ) {
			return;
		}

		selection.removeAllRanges();
	}

	selection.addRange( range );

	// This function is not intended to cause a shift in focus. Since the above
	// selection manipulations may shift focus, ensure that focus is restored to
	// its previous state.
	if ( activeElement !== ownerDocument.activeElement ) {
		// The `instanceof` checks protect against edge cases where the focused
		// element is not of the interface HTMLElement (does not have a `focus`
		// or `blur` property).
		//
		// See: https://github.com/Microsoft/TypeScript/issues/5901#issuecomment-431649653
		if ( activeElement instanceof defaultView.HTMLElement ) {
			activeElement.focus();
		}
	}
}
