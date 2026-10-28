import { useRefEffect } from '@wordpress/compose';
import { setContentEditableWrapper } from '../../writing-flow/utils';

const nodesByDocument = new Map< Document, Set< HTMLElement > >();

function add( doc: Document, node: HTMLElement ) {
	let set = nodesByDocument.get( doc );
	if ( ! set ) {
		set = new Set();
		nodesByDocument.set( doc, set );
		doc.addEventListener( 'pointerdown', down );
	}
	set.add( node );
}

function remove( doc: Document, node: HTMLElement ) {
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

function restore( node: HTMLElement ) {
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

function down( event: PointerEvent ) {
	// Pointer events target elements.
	const target = event.target as HTMLElement;
	const { ownerDocument, isContentEditable, tagName } = target;
	const isInputOrTextArea = [ 'INPUT', 'TEXTAREA' ].includes( tagName );

	// The listener only runs on documents with registered nodes.
	const nodes = nodesByDocument.get( ownerDocument )!;
	// A block's own element, such as a list item around its bullet, is only
	// editable inside an editing host. A press on it is not in a field.
	const isBlockElement =
		nodes.has( target ) && target.contentEditable === 'inherit';

	if ( ( isContentEditable && ! isBlockElement ) || isInputOrTextArea ) {
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

	// Inside an editing host the browser places a caret on press instead of
	// dragging the block. The press selects the block as a whole, which
	// needs no editing host, so the host stops editing.
	if ( isBlockElement && isContentEditable && target.draggable ) {
		setContentEditableWrapper(
			// An element inside an editing host has an editable ancestor.
			target.parentElement!.closest< HTMLElement >(
				'[contenteditable="true"]'
			)!,
			false
		);
	}
}

/**
 * In Firefox, the `draggable` and `contenteditable` or `input` or `textarea`
 * elements don't play well together. When these elements are within a
 * `draggable` element, selection doesn't get set in the right place. The only
 * solution is to temporarily remove the `draggable` attribute clicking inside
 * these elements.
 * @return Cleanup function.
 */
export function useFirefoxDraggableCompatibility() {
	return useRefEffect( ( node: HTMLElement ) => {
		add( node.ownerDocument, node );
		return () => {
			remove( node.ownerDocument, node );
		};
	}, [] );
}
