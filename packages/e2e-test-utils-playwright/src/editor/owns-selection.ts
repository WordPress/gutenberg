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
