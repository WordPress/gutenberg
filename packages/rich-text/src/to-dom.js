/**
 * Internal dependencies
 */

import { toTree } from './to-tree';

/**
 * Browser dependencies
 */

const { TEXT_NODE, ELEMENT_NODE } = window.Node;

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

function createEmpty() {
	const { body } = document.implementation.createHTMLDocument( '' );
	return body;
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

function isText( { nodeType } ) {
	return nodeType === TEXT_NODE;
}

function getText( { nodeValue } ) {
	return nodeValue;
}

function remove( node ) {
	return node.parentNode.removeChild( node );
}

function createBogusBR( doc ) {
	const br = doc.createElement( 'br' );
	br.setAttribute( 'data-mce-bogus', '1' );
	return br;
}

function pad( node ) {
	const length = node.childNodes.length;

	// Optimise for speed.
	for ( let index = 0; index < length; index++ ) {
		const child = node.childNodes[ index ];

		if ( child.nodeType === TEXT_NODE ) {
			if ( length === 1 && ! child.nodeValue ) {
				node.appendChild( createBogusBR( node.ownerDocument ) );
			}
		} else {
			if ( ! child.previousSibling && ( child.nodeName === 'OL' || child.nodeName === 'UL' ) ) {
				node.insertBefore( createBogusBR( child.ownerDocument ), child );
			}

			pad( child );
		}
	}
}

export function toDom( value, multilineTag ) {
	let startPath = [];
	let endPath = [];

	const tree = toTree( value, multilineTag, {
		createEmpty,
		append,
		getLastChild,
		getParent,
		isText,
		getText,
		remove,
		appendText,
		onStartIndex( body, pointer ) {
			startPath = createPathToNode( pointer, body, [ pointer.nodeValue.length ] );
		},
		onEndIndex( body, pointer ) {
			endPath = createPathToNode( pointer, body, [ pointer.nodeValue.length ] );
		},
	} );

	pad( tree );

	return {
		body: tree,
		selection: { startPath, endPath },
	};
}

/**
 * Create an `Element` tree from a Rich Text value and applies the difference to
 * the `Element` tree contained by `current`. If a `multilineTag` is provided,
 * text separated by two new lines will be wrapped in an `Element` of that type.
 *
 * @param {Object}      value        Value to apply.
 * @param {HTMLElement} current      The live root node to apply the element
 *                                   tree to.
 * @param {string}      multilineTag Multiline tag.
 */
export function apply( value, current, multilineTag ) {
	// Construct a new element tree in memory.
	const { body, selection } = toDom( value, multilineTag );

	applyValue( body, current );

	if ( value.start !== undefined ) {
		applySelection( selection, current );
	}
}

export function applyValue( future, current ) {
	let i = 0;

	while ( future.firstChild ) {
		const currentChild = current.childNodes[ i ];
		const futureNodeType = future.firstChild.nodeType;

		if ( ! currentChild ) {
			current.appendChild( future.firstChild );
		} else if (
			futureNodeType !== currentChild.nodeType ||
			futureNodeType !== TEXT_NODE ||
			future.firstChild.nodeValue !== currentChild.nodeValue
		) {
			current.replaceChild( future.firstChild, currentChild );
		} else {
			future.removeChild( future.firstChild );
		}

		i++;
	}

	while ( current.childNodes[ i ] ) {
		current.removeChild( current.childNodes[ i ] );
	}
}

export function applySelection( selection, current ) {
	const { node: startContainer, offset: startOffset } = getNodeByPath( current, selection.startPath );
	const { node: endContainer, offset: endOffset } = getNodeByPath( current, selection.endPath );

	const windowSelection = window.getSelection();
	const range = current.ownerDocument.createRange();
	const collapsed = startContainer === endContainer && startOffset === endOffset;

	if (
		collapsed &&
		startOffset === 0 &&
		startContainer.previousSibling &&
		startContainer.previousSibling.nodeType === ELEMENT_NODE &&
		startContainer.previousSibling.nodeName !== 'BR'
	) {
		startContainer.insertData( 0, '\uFEFF' );
		range.setStart( startContainer, 1 );
		range.setEnd( endContainer, 1 );
	} else if (
		collapsed &&
		startOffset === 0 &&
		startContainer === TEXT_NODE &&
		startContainer.nodeValue.length === 0
	) {
		startContainer.insertData( 0, '\uFEFF' );
		range.setStart( startContainer, 1 );
		range.setEnd( endContainer, 1 );
	} else {
		range.setStart( startContainer, startOffset );
		range.setEnd( endContainer, endOffset );
	}

	windowSelection.removeAllRanges();
	windowSelection.addRange( range );
}
