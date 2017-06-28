/**
 * External dependencies
 */
import { nodeListToReact } from 'dom-react';
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { createElement } from 'element';

/**
 * Internal dependencies
 */
import { createBlock } from './factory';
import { getBlockTypes, getUnknownTypeHandler } from './registration';
import { getBlockAttributes } from './parser';

/**
 * Normalises array nodes of any node type to an array of block level nodes.
 * @param  {Array} nodes Array of Nodes.
 * @return {Array}       Array of block level HTMLElements
 */
export function normaliseToBlockLevelNodes( nodes ) {
	const decu = document.createDocumentFragment();
	const accu = document.createDocumentFragment();

	// A fragment is easier to work with.
	nodes.forEach( node => decu.appendChild( node.cloneNode( true ) ) );

	while ( decu.firstChild ) {
		const node = decu.firstChild;

		// Text nodes: wrap in a paragraph, or append to previous.
		if ( node.nodeType === 3 ) {
			if ( ! accu.lastChild || accu.lastChild.nodeName !== 'P' ) {
				accu.appendChild( document.createElement( 'P' ) );
			}

			accu.lastChild.appendChild( node );
		// BR nodes: create a new paragraph on double, or append to previous.
		} else if ( node.nodeName === 'BR' ) {
			if ( node.nextSibling && node.nextSibling.nodeName === 'BR' ) {
				accu.appendChild( document.createElement( 'P' ) );
				decu.removeChild( node.nextSibling );
			}

			// Don't append to an empty paragraph.
			if (
				accu.lastChild &&
				accu.lastChild.nodeName === 'P' &&
				accu.lastChild.hasChildNodes()
			) {
				accu.lastChild.appendChild( node );
			} else {
				decu.removeChild( node );
			}
		} else if ( node.nodeType === 1 ) {
			accu.appendChild( node );
		}
	}

	return Array.from( accu.childNodes );
}

export default function( nodes ) {
	return normaliseToBlockLevelNodes( nodes ).map( ( node ) => {
		const type = find( getBlockTypes(), ( { pasteMatcher } ) => {
			return pasteMatcher && pasteMatcher( node );
		} );
		const name = type ? type.name : getUnknownTypeHandler();
		const attributes = type
			? getBlockAttributes( type, node.outerHTML )
			: { content: nodeListToReact( [ node ], createElement ) };

		return createBlock( name, attributes );
	} );
}
