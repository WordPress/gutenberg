/**
 * WordPress dependencies
 */
import { nodetypes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import { isInline } from './utils';

const { ELEMENT_NODE, TEXT_NODE } = nodetypes;

export default function( HTML ) {
	const decuDoc = document.implementation.createHTMLDocument( '' );
	const accuDoc = document.implementation.createHTMLDocument( '' );

	const decu = decuDoc.body;
	const accu = accuDoc.body;

	decu.innerHTML = HTML;

	while ( decu.firstChild ) {
		const node = decu.firstChild;

		// Text nodes: wrap in a paragraph, or append to previous.
		if ( node.nodeType === TEXT_NODE ) {
			if ( ! accu.lastChild || accu.lastChild.nodeName !== 'P' ) {
				accu.appendChild( document.createElement( 'P' ) );
			}

			accu.lastChild.appendChild( node );
		// Element nodes.
		} else if ( node.nodeType === ELEMENT_NODE ) {
			// BR nodes: create a new paragraph on double, or append to previous.
			if ( node.nodeName === 'BR' ) {
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
			} else if ( node.nodeName === 'P' ) {
				// Only append non-empty paragraph nodes.
				if ( /^(\s|&nbsp;)*$/.test( node.innerHTML ) ) {
					decu.removeChild( node );
				} else {
					accu.appendChild( node );
				}
			} else if ( isInline( node ) ) {
				accu.appendChild( document.createElement( 'P' ) );
				accu.lastChild.appendChild( node );
			} else {
				accu.appendChild( node );
			}
		} else {
			decu.removeChild( node );
		}
	}

	return accu.innerHTML;
}
