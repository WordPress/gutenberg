/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';

const nodesByDocument = new Map();

function add( doc, node ) {
	let set = nodesByDocument.get( doc );
	if ( ! set ) {
		set = new Set();
		nodesByDocument.set( doc, set );
		doc.addEventListener( 'pointerdown', down );
	}
	set.add( node );
}

function remove( doc, node ) {
	const set = nodesByDocument.get( doc );
	if ( set ) {
		set.delete( node );
		restore( node );
		if ( set.size === 0 ) {
			nodesByDocument.delete( doc );
			doc.removeEventListener( 'pointerdown', down );
		}
	}
}

function restore( node ) {
	const prevDraggable = node.getAttribute( 'data-draggable' );
	if ( prevDraggable ) {
		node.removeAttribute( 'data-draggable' );
		// Only restore if `draggable` is still removed. It could have been
		// changed by React in the meantime.
		if ( prevDraggable === 'true' && ! node.getAttribute( 'draggable' ) ) {
			node.setAttribute( 'draggable', 'true' );
		}
	}
}

function down( event ) {
	const { target } = event;
	const { ownerDocument, isContentEditable, tagName } = target;
	const isInputOrTextArea = [ 'INPUT', 'TEXTAREA' ].includes( tagName );

	const nodes = nodesByDocument.get( ownerDocument );

	if ( isContentEditable || isInputOrTextArea ) {
		// Whenever an editable element or an input or textarea is clicked,
		// check which draggable blocks contain this element, and temporarily
		// disable draggability.
		for ( const node of nodes ) {
			if (
				node.getAttribute( 'draggable' ) === 'true' &&
				node.contains( target )
			) {
				node.removeAttribute( 'draggable' );
				node.setAttribute( 'data-draggable', 'true' );
			}
		}
	} else {
		// Whenever a non-editable element or an input or textarea is clicked,
		// re-enable draggability for any blocks that were previously disabled.
		for ( const node of nodes ) {
			restore( node );
		}
	}
}

/**
 * In Firefox, the `draggable` and `contenteditable` or `input` or `textarea`
 * elements don't play well together. When these elements are within a
 * `draggable` element, selection doesn't get set in the right place. The only
 * solution is to temporarily remove the `draggable` attribute clicking inside
 * these elements.
 * @return {Function} Cleanup function.
 */
export function useFirefoxDraggableCompatibility() {
	return useRefEffect( ( node ) => {
		add( node.ownerDocument, node );
		return () => {
			remove( node.ownerDocument, node );
		};
	}, [] );
}
