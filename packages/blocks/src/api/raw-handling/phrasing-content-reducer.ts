/**
 * WordPress dependencies
 */
import { wrap, replaceTag } from '@wordpress/dom';

export default function phrasingContentReducer(
	node: Node,
	doc: Document
): void {
	// In jsdom-jscore, 'node.style' can be null.
	// TODO: Explore fixing this by patching jsdom-jscore.
	if ( node.nodeName === 'SPAN' && ( node as HTMLElement ).style ) {
		const {
			fontWeight,
			fontStyle,
			textDecorationLine,
			textDecoration,
			verticalAlign,
		} = ( node as HTMLElement ).style;

		const element = node as Element;

		if ( fontWeight === 'bold' || fontWeight === '700' ) {
			wrap( doc.createElement( 'strong' ), element );
		}

		if ( fontStyle === 'italic' ) {
			wrap( doc.createElement( 'em' ), element );
		}

		// Some DOM implementations (Safari, JSDom) don't support
		// style.textDecorationLine, so we check style.textDecoration as a
		// fallback.
		if (
			textDecorationLine === 'line-through' ||
			textDecoration.includes( 'line-through' )
		) {
			wrap( doc.createElement( 's' ), element );
		}

		if ( verticalAlign === 'super' ) {
			wrap( doc.createElement( 'sup' ), element );
		} else if ( verticalAlign === 'sub' ) {
			wrap( doc.createElement( 'sub' ), element );
		}
	} else if ( node.nodeName === 'B' ) {
		replaceTag( node as Element, 'strong' );
	} else if ( node.nodeName === 'I' ) {
		replaceTag( node as Element, 'em' );
	} else if ( node.nodeName === 'A' ) {
		const anchor = node as HTMLAnchorElement;
		// In jsdom-jscore, 'node.target' can be null.
		// TODO: Explore fixing this by patching jsdom-jscore.
		if ( anchor.target && anchor.target.toLowerCase() === '_blank' ) {
			anchor.rel = 'noopener';
		} else {
			anchor.removeAttribute( 'target' );
			anchor.removeAttribute( 'rel' );
		}

		// Saves anchor elements name attribute as id
		if ( anchor.name && ! anchor.id ) {
			anchor.id = anchor.name;
		}

		// Keeps id only if there is an internal link pointing to it
		if (
			anchor.id &&
			! anchor.ownerDocument.querySelector( `[href="#${ anchor.id }"]` )
		) {
			anchor.removeAttribute( 'id' );
		}
	}
}
