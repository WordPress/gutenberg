/**
 * Internal dependencies
 */

import { toTree } from './to-tree';
import { createElement } from './create-element';
import { isRangeEqual } from './is-range-equal';

/** @typedef {import('./types').RichTextValue} RichTextValue */

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
	if ( child.html !== undefined ) {
		return ( element.innerHTML += child.html );
	}

	if ( typeof child === 'string' ) {
		child = element.ownerDocument.createTextNode( child );
	}

	const { type, attributes } = child;

	if ( type ) {
		if ( type === '#comment' ) {
			child = element.ownerDocument.createComment(
				attributes[ 'data-rich-text-comment' ]
			);
		} else {
			child = element.ownerDocument.createElement( type );

			for ( const key in attributes ) {
				child.setAttribute( key, attributes[ key ] );
			}
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
 * Create an `Element` tree from a Rich Text value and applies the difference to
 * the `Element` tree contained by `current`.
 *
 * @param {Object}        $1                       Named arguments.
 * @param {RichTextValue} $1.value                 Value to apply.
 * @param {HTMLElement}   $1.current               The live root node to apply the element tree to.
 * @param {Function}      [$1.prepareEditableTree] Function to filter editorable formats.
 * @param {boolean}       [$1.__unstableDomOnly]   Only apply elements, no selection.
 * @param {string}        [$1.placeholder]         Placeholder text.
 */
export function apply( {
	value,
	current,
	prepareEditableTree,
	__unstableDomOnly,
	placeholder,
} ) {
	// Construct a new element tree in memory.
	const { body, selection } = toDom( {
		value,
		prepareEditableTree,
		placeholder,
		doc: current.ownerDocument,
	} );

	applyValue( body, current );

	if ( value.start !== undefined && ! __unstableDomOnly ) {
		applySelection( selection, current );
	}
}

export function applyValue( future, current ) {
	let i = 0;
	let futureChild;

	while ( ( futureChild = future.firstChild ) ) {
		const currentChild = current.childNodes[ i ];

		if ( ! currentChild ) {
			current.appendChild( futureChild );
		} else if ( ! currentChild.isEqualNode( futureChild ) ) {
			if (
				currentChild.nodeName !== futureChild.nodeName ||
				( currentChild.nodeType === currentChild.TEXT_NODE &&
					currentChild.data !== futureChild.data )
			) {
				current.replaceChild( futureChild, currentChild );
			} else {
				const currentAttributes = currentChild.attributes;
				const futureAttributes = futureChild.attributes;

				if ( currentAttributes ) {
					let ii = currentAttributes.length;

					// Reverse loop because `removeAttribute` on `currentChild`
					// changes `currentAttributes`.
					while ( ii-- ) {
						const { name } = currentAttributes[ ii ];

						if ( ! futureChild.getAttribute( name ) ) {
							currentChild.removeAttribute( name );
						}
					}
				}

				if ( futureAttributes ) {
					for ( let ii = 0; ii < futureAttributes.length; ii++ ) {
						const { name, value } = futureAttributes[ ii ];

						if ( currentChild.getAttribute( name ) !== value ) {
							currentChild.setAttribute( name, value );
						}
					}
				}

				applyValue( futureChild, currentChild );
				future.removeChild( futureChild );
			}
		} else {
			future.removeChild( futureChild );
		}

		i++;
	}

	while ( current.childNodes[ i ] ) {
		current.removeChild( current.childNodes[ i ] );
	}
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
