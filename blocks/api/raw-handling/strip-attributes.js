/**
 * Browser dependencies
 */
const { ELEMENT_NODE } = window.Node;

/**
 * Internal dependencies
 */
import { isAttributeWhitelisted, isClassWhitelisted } from './utils';

export default function( node ) {
	if ( node.nodeType !== ELEMENT_NODE ) {
		return;
	}

	if ( ! node.hasAttributes() ) {
		return;
	}

	const tag = node.nodeName.toLowerCase();

	Array.from( node.attributes ).forEach( ( { name } ) => {
		if ( name === 'class' || isAttributeWhitelisted( tag, name ) ) {
			return;
		}

		node.removeAttribute( name );
	} );

	const oldClasses = node.getAttribute( 'class' );

	if ( ! oldClasses ) {
		return;
	}

	const newClasses = oldClasses
		.split( ' ' )
		.filter( ( name ) => name && isClassWhitelisted( tag, name ) )
		.join( ' ' );

	if ( newClasses.length ) {
		node.setAttribute( 'class', newClasses );
	} else {
		node.removeAttribute( 'class' );
	}
}
