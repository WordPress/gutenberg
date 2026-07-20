/**
 * External dependencies
 */
import type { Locator } from '@playwright/test';

/**
 * Internal dependencies
 */
import type { Editor } from './index';

/**
 * Returns whether the given element owns the document selection: either the
 * element itself has focus, or a focused editing host contains both the
 * element and the selection. Useful for asserting that a block holds the
 * selection regardless of whether the block element or an editable canvas
 * wrapper has focus.
 *
 * @param this
 * @param locator The element that should own the selection.
 */
export async function ownsSelection( this: Editor, locator: Locator ) {
	return locator.evaluate( ( element ) => {
		const activeElement = element.ownerDocument
			.activeElement as HTMLElement | null;
		if ( element === activeElement ) {
			return true;
		}
		const selection = element.ownerDocument.defaultView?.getSelection();
		return (
			!! activeElement?.isContentEditable &&
			activeElement.contains( element ) &&
			!! selection?.anchorNode &&
			element.contains( selection.anchorNode )
		);
	} );
}

/**
 * Returns the label of the element owning the focus: the active element, or,
 * when a focused editing host owns the selection, the editable element
 * containing it. Falls back to the element's text when it has no label.
 *
 * @param this
 */
export async function getFocusOwnerLabel( this: Editor ) {
	return this.page.evaluate( () => {
		const doc =
			( document.activeElement as HTMLIFrameElement | null )
				?.contentDocument ?? document;
		let activeElement = doc.activeElement as HTMLElement;
		const selection = doc.defaultView?.getSelection();
		const anchorNode = selection?.anchorNode;
		const focusNode = selection?.focusNode;
		if (
			activeElement.isContentEditable &&
			anchorNode &&
			activeElement.contains( anchorNode )
		) {
			const editable = (
				anchorNode.nodeType === anchorNode.ELEMENT_NODE
					? ( anchorNode as HTMLElement )
					: anchorNode.parentElement
			)?.closest< HTMLElement >( '[contenteditable="true"]' );
			if (
				editable &&
				editable !== activeElement &&
				focusNode &&
				editable.contains( focusNode )
			) {
				activeElement = editable;
			}
		}
		return (
			activeElement.getAttribute( 'aria-label' ) ||
			activeElement.innerText
		);
	} );
}
