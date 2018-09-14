/**
 * Internal dependencies
 */

import { split } from './split';

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

export function recordToDom( { formats, text, start, end }, tag ) {
	const htmlDocument = document.implementation.createHTMLDocument( '' );
	let { body } = htmlDocument;
	let startPath = [];
	let endPath = [];

	const formatsLength = formats.length + 1;

	if ( tag ) {
		body = body.appendChild( htmlDocument.createElement( tag ) );
	}

	body.appendChild( htmlDocument.createTextNode( '' ) );

	for ( let i = 0; i < formatsLength; i++ ) {
		const character = text.charAt( i );
		const nextFormats = formats[ i ] || [];
		let pointer = body.lastChild;

		if ( nextFormats ) {
			nextFormats.forEach( ( { type, attributes, object } ) => {
				if ( pointer && type === pointer.nodeName.toLowerCase() ) {
					pointer = pointer.lastChild;
					return;
				}

				const newNode = htmlDocument.createElement( type );
				const parentNode = pointer.parentNode;

				for ( const key in attributes ) {
					newNode.setAttribute( key, attributes[ key ] );
				}

				parentNode.appendChild( newNode );

				if ( pointer.nodeType === TEXT_NODE && pointer.nodeValue === '' ) {
					pointer.parentNode.removeChild( pointer );
				}

				pointer = ( object ? parentNode : newNode ).appendChild( htmlDocument.createTextNode( '' ) );
			} );
		}

		if ( character ) {
			if ( character === '\n' ) {
				pointer = pointer.parentNode.appendChild( htmlDocument.createElement( 'br' ) );
			} else if ( pointer.nodeType === TEXT_NODE ) {
				pointer.appendData( character );
			} else {
				pointer = pointer.parentNode.appendChild( htmlDocument.createTextNode( character ) );
			}
		}

		if ( start === i + 1 ) {
			const initialPath = [ pointer.nodeValue.length ];
			startPath = createPathToNode( pointer, body, initialPath );
		}

		if ( start === end ) {
			endPath = startPath;
		} else if ( end === i + 1 ) {
			const initialPath = [ pointer.nodeValue.length ];
			endPath = createPathToNode( pointer, body, initialPath );
		}
	}

	return {
		body,
		selection: { startPath, endPath },
	};
}

export function multilineRecordToDom( record, tag ) {
	const htmlDocument = document.implementation.createHTMLDocument( '' );
	const { body } = htmlDocument;
	let startPath = [];
	let endPath = [];

	split( record, '\n\n' ).forEach( ( piece, index ) => {
		const dom = recordToDom( piece, tag );

		body.appendChild( dom.body );

		if ( dom.selection.startPath.length ) {
			startPath = [ index, ...dom.selection.startPath ];
		}

		if ( dom.selection.endPath.length ) {
			endPath = [ index, ...dom.selection.endPath ];
		}
	} );

	return {
		body,
		selection: { startPath, endPath },
	};
}

/**
 * Applies the given element tree and selection to the live DOM (very basic diff
 * for now).
 *
 * @param {Object}      record       Record to apply.
 * @param {HTMLElement} current      The live root node to apply the element
 *                                   tree to.
 * @param {string}      multilineTag Multiline tag.
 */
export function apply( record, current, multilineTag ) {
	// Construct a new element tree in memory
	const toDom = multilineTag ? multilineRecordToDom : recordToDom;
	const { body, selection } = toDom( record, multilineTag );

	applyValue( body, current );

	if ( record.start !== undefined ) {
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
