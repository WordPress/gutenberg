import {
	focus,
	isFormElement,
	isTextField,
	placeCaretAtHorizontalEdge,
} from '@wordpress/dom';
import { isInsideRootBlock } from './dom';

/**
 * Focuses a block's first or last editable field, falling back to its wrapper.
 *
 * @param blockElement        Block wrapper element.
 * @param initialPosition     Caret position, or `true` to focus the wrapper.
 * @param shouldPreserveCaret Whether an existing caret should be left in place.
 */
export function focusBlock(
	blockElement: HTMLElement,
	initialPosition: number | boolean = 0,
	shouldPreserveCaret?: ( target: HTMLElement ) => boolean
) {
	if ( initialPosition === true ) {
		blockElement.focus();
		return;
	}

	const textInputs = focus.tabbable
		.find( blockElement )
		.filter( ( node ) => isTextField( node ) );
	const isReverse = initialPosition === -1;
	const target =
		textInputs[ isReverse ? textInputs.length - 1 : 0 ] || blockElement;

	// Nested blocks manage their own focus.
	if ( ! isInsideRootBlock( blockElement, target ) ) {
		blockElement.focus();
		return;
	}

	if ( ! blockElement.getAttribute( 'contenteditable' ) ) {
		const focusElement = focus.tabbable.findNext( blockElement );
		if (
			focusElement &&
			isInsideRootBlock( blockElement, focusElement ) &&
			isFormElement( focusElement )
		) {
			focusElement.focus();
			return;
		}
	}

	if ( ! shouldPreserveCaret?.( target ) ) {
		placeCaretAtHorizontalEdge( target, isReverse );
	}
}
