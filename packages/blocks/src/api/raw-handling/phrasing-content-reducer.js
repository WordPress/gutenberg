/**
 * WordPress dependencies
 */
import { wrap, replaceTag } from '@wordpress/dom';

function removeStyle( node, property ) {
	node.style[ property ] = '';
	if ( ! node.style.length ) {
		node.removeAttribute( 'style' );
	}
}

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

		if ( fontWeight === 'normal' || fontWeight === '400' ) {
			removeStyle( node, 'fontWeight' );
		}

		if ( fontWeight === 'bold' || fontWeight === '700' ) {
			removeStyle( node, 'fontWeight' );
			wrap( doc.createElement( 'strong' ), node );
		}

		if ( fontStyle === 'italic' ) {
			removeStyle( node, 'fontStyle' );
			wrap( doc.createElement( 'em' ), node );
		}

		// Some DOM implementations (Safari, JSDom) don't support
		// style.textDecorationLine, so we check style.textDecoration as a
		// fallback.
		if (
			textDecorationLine === 'line-through' ||
			textDecoration.includes( 'line-through' )
		) {
			removeStyle( node, 'textDecoration' );
			wrap( doc.createElement( 's' ), node );
		}

		if ( verticalAlign === 'super' ) {
			removeStyle( node, 'verticalAlign' );
			wrap( doc.createElement( 'sup' ), node );
		} else if ( verticalAlign === 'sub' ) {
			removeStyle( node, 'verticalAlign' );
			wrap( doc.createElement( 'sub' ), node );
		}
	} else if ( node.nodeName === 'B' ) {
		node = replaceTag( node, 'strong' );
	} else if ( node.nodeName === 'I' ) {
		node = replaceTag( node, 'em' );
	}
}
