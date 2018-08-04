/**
 * WordPress dependencies
 */
import { unwrap, replaceTag } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { isPhrasingContent } from './phrasing-content';

function isBlockContent( node, schema = {} ) {
	return schema.hasOwnProperty( node.nodeName.toLowerCase() );
}

export default function( node, doc, schema ) {
	if ( node.nodeName === 'SPAN' ) {
		const { fontWeight, fontStyle } = node.style;

		if ( fontWeight === 'bold' || fontWeight === '700' ) {
			node = replaceTag( node, 'strong', doc );
		} else if ( fontStyle === 'italic' ) {
			node = replaceTag( node, 'em', doc );
		}
	} else if ( node.nodeName === 'B' ) {
		node = replaceTag( node, 'strong', doc );
	} else if ( node.nodeName === 'I' ) {
		node = replaceTag( node, 'em', doc );
	} else if ( node.nodeName === 'A' ) {
		if ( node.target.toLowerCase() === '_blank' ) {
			node.rel = 'noreferrer noopener';
		} else {
			node.removeAttribute( 'target' );
			node.removeAttribute( 'rel' );
		}
	}

	if (
		isPhrasingContent( node ) &&
		node.hasChildNodes() &&
		Array.from( node.childNodes ).some( ( child ) => isBlockContent( child, schema ) )
	) {
		unwrap( node );
	}
}
