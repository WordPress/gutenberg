/**
 * External dependencies
 */
import { nodeListToReact } from 'dom-react';

/**
 * WordPress dependencies
 */
import { createElement } from 'element';

/**
 * Internal dependencies
 */
import { createBlock } from './factory';

/**
 * Normalises array nodes of any node type to an array of block level nodes.
 * @param  {Array} nodes Array of Nodes.
 * @return {Array}       Array of block level HTMLElements
 */
function normaliseToBlockLevelNodes( nodes ) {
	return nodes.reduce( ( acc, node, index ) => {
		// Text nodes: wrap in a paragraph, or append to previous.
		if ( node.nodeType === 3 ) {
			if ( ! acc.length || acc[ acc.length - 1 ].nodeName !== 'P' ) {
				acc.push( document.createElement( 'P' ) );
			}

			acc[ acc.length - 1 ].appendChild( node );
		// BR nodes: create a new paragraph on double, or append to
		// previous.
		} else if ( node.nodeName === 'BR' ) {
			if ( nodes[ index + 1 ] && nodes[ index + 1 ].nodeName === 'BR' ) {
				acc.push( document.createElement( 'P' ) );
			}

			// Don't append to an empty paragraph.
			if ( acc[ acc.length - 1 ].hasChildNodes() ) {
				acc[ acc.length - 1 ].appendChild( node );
			}
		} else if ( node.nodeType === 1 ) {
			acc.push( node );
		}

		return acc;
	}, [] );
}

export default function( nodes ) {
	return normaliseToBlockLevelNodes( nodes ).map( ( node ) => {
		// To do: move to block registration.
		if ( node.nodeName === 'P' ) {
			return createBlock( 'core/text', {
				content: nodeListToReact( node.childNodes, createElement ),
			} );
		}

		return createBlock( 'core/freeform', {
			content: nodeListToReact( [ node ], createElement ),
		} );
	} );
}
