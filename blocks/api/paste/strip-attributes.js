/**
 * Browser dependencies
 */
const { ELEMENT_NODE } = window.Node;

/**
 * Internal dependencies
 */
import { isAttributeWhitelisted } from './utils';

export default function( node ) {
	if ( node.nodeType !== ELEMENT_NODE ) {
		return;
	}

	if ( ! node.hasAttributes() ) {
		return;
	}

	const tag = node.nodeName.toLowerCase();

	Array.from( node.attributes ).forEach( ( { name } ) => {
		if ( isAttributeWhitelisted( tag, name ) ) {
			return;
		}

		node.removeAttribute( name );
	} );
}
