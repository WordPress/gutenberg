/**
 * WordPress dependencies
 */
import { wrap, replaceTag } from '@wordpress/dom';

export default function phrasingContentReducer( node, doc ) {
	// In jsdom-jscore, 'node.style' can be null.
	// TODO: Explore fixing this by patching jsdom-jscore.
	if ( node.nodeName === 'SPAN' && node.style ) {
		const {
			fontWeight,
			fontStyle,
			textDecorationLine,
			textDecoration,
			verticalAlign,
		} = node.style;

		if ( fontWeight === 'bold' || fontWeight === '700' ) {
			wrap( doc.createElement( 'strong' ), node );
		}

		if ( fontStyle === 'italic' ) {
			wrap( doc.createElement( 'em' ), node );
		}

		// Some DOM implementations (Safari, JSDom) don't support
		// style.textDecorationLine, so we check style.textDecoration as a
		// fallback.
		if (
			textDecorationLine === 'line-through' ||
			textDecoration.includes( 'line-through' )
		) {
			wrap( doc.createElement( 's' ), node );
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
		// In jsdom-jscore, 'node.target' can be null.
		// TODO: Explore fixing this by patching jsdom-jscore.
		if ( node.target && node.target.toLowerCase() === '_blank' ) {
			node.rel = 'noreferrer noopener';
		} else {
			node.removeAttribute( 'target' );
			node.removeAttribute( 'rel' );
		}

		// Saves anchor elements name attribute as id
		if ( node.name && ! node.id ) {
			node.id = node.name;
		}

		// Keeps id only if there is an internal link pointing to it
		if (
			node.id &&
			! node.ownerDocument.querySelector( `[href="#${ node.id }"]` )
		) {
			node.removeAttribute( 'id' );
		}
	}
}
