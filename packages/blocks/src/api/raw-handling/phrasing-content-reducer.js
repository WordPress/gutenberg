/**
 * WordPress dependencies
 */
import { wrap, replaceTag } from '@wordpress/dom';

export default function( node, doc ) {
	if ( node.nodeName === 'SPAN' ) {
		const {
			fontWeight,
			fontStyle,
			textDecorationLine,
			verticalAlign,
		} = node.style;

		if ( fontWeight === 'bold' || fontWeight === '700' ) {
			wrap( doc.createElement( 'strong' ), node );
		}

		if ( fontStyle === 'italic' ) {
			wrap( doc.createElement( 'em' ), node );
		}

		if ( textDecorationLine === 'line-through' ) {
			wrap( doc.createElement( 'del' ), node );
		}

		if ( verticalAlign === 'super' ) {
			wrap( doc.createElement( 'sup' ), node );
		} else if ( verticalAlign === 'sub' ) {
			wrap( doc.createElement( 'sub' ), node );
		}
	} else if ( node.nodeName === 'B' ) {
		node = replaceTag( node, 'strong' );
	} else if ( node.nodeName === 'I' ) {
		node = replaceTag( node, 'em' );
	} else if ( node.nodeName === 'A' ) {
		if ( node.target.toLowerCase() === '_blank' ) {
			node.rel = 'noreferrer noopener';
		} else {
			node.removeAttribute( 'target' );
			node.removeAttribute( 'rel' );
		}
	}
}
