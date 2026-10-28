import { BACKSPACE, DELETE } from '@wordpress/keycodes';
import { remove } from '../../remove';
import { OBJECT_REPLACEMENT_CHARACTER, ZWNBSP } from '../../special-characters';
import { subscribeOwnedListener } from '../../subscribe-owned-listener';
import type { EventListenerEffect } from '../types';

/**
 * Whether the selection is a caret right behind padding: in a text node whose
 * content up to the caret is only padding, as after `End` on a line that ends
 * in a line break or a non editable element. The padding is not part of the
 * value, so a native Backspace from there would only remove the padding, which
 * the next render restores.
 *
 * @param selection The document selection.
 */
function isCaretAfterPadding( selection: Selection ) {
	const { focusNode, focusOffset, anchorNode, anchorOffset } = selection;

	if (
		! focusNode ||
		focusNode !== anchorNode ||
		focusNode.nodeType !== focusNode.TEXT_NODE
	) {
		return false;
	}

	// A selection extended backwards over the padding only (Shift+ArrowLeft
	// from `End`) covers nothing visible, so it counts as the caret behind it.
	const offset = Math.max( focusOffset, anchorOffset );
	const textBeforeCaret = focusNode.nodeValue!.slice( 0, offset );

	return (
		textBeforeCaret.length > 0 &&
		[ ...textBeforeCaret ].every( ( char ) => char === ZWNBSP )
	);
}

const deleteHandler: EventListenerEffect = ( props ) => ( element ) => {
	function onKeyDown( event: KeyboardEvent ) {
		const { keyCode } = event;

		if ( event.defaultPrevented ) {
			return;
		}

		if ( keyCode !== DELETE && keyCode !== BACKSPACE ) {
			return;
		}

		const { createRecord, handleChange } = props.current;
		const currentValue = createRecord();
		const { start, end, text } = currentValue;

		// Without a selection there is nothing to act on; the checks below
		// all need both offsets.
		if ( start === undefined || end === undefined ) {
			return;
		}

		// Always handle full content deletion ourselves.
		if ( start === 0 && end !== 0 && end === text.length ) {
			handleChange( remove( currentValue ) );
			event.preventDefault();
			return;
		}

		// A selected object (e.g. a clicked footnote marker) is removed by
		// the value, not the browser: browsers don't reliably delete a
		// selection that consists of a non editable element.
		if (
			end === start + 1 &&
			text[ start ] === OBJECT_REPLACEMENT_CHARACTER
		) {
			handleChange( remove( currentValue ) );
			event.preventDefault();
			return;
		}

		// Behind padding, remove the character the padding follows (the line
		// break or the non editable object): that is what the user sees the
		// caret right after.
		if (
			keyCode === BACKSPACE &&
			start === end &&
			start > 0 &&
			isCaretAfterPadding(
				element.ownerDocument.defaultView!.getSelection()!
			)
		) {
			handleChange( remove( currentValue, start - 1, start ) );
			event.preventDefault();
		}
	}

	return subscribeOwnedListener(
		element,
		'keydown',
		onKeyDown as EventListener
	);
};

export default deleteHandler;
