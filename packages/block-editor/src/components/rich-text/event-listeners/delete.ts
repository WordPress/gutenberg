import { DELETE, BACKSPACE } from '@wordpress/keycodes';
import {
	isCollapsed,
	isEmpty,
	privateApis as richTextPrivateApis,
} from '@wordpress/rich-text';
import type { RichTextValue } from '@wordpress/rich-text';
import { unlock } from '../../../lock-unlock';
import type { RichTextEventListener } from '../types';

const { subscribeOwnedListener } = unlock( richTextPrivateApis );

const deleteListener: RichTextEventListener = ( props ) => ( element ) => {
	/**
	 * Merges or removes the block when a collapsed caret is deleted at its
	 * edge, including when a format is active there. When an editable root
	 * holds focus, a delete left to the browser merges the block's element
	 * into its neighbour on the canvas, while both blocks remain in the list.
	 *
	 * @param event     The event to prevent when it is handled.
	 * @param value     The rich text value.
	 * @param isReverse Whether the delete is backward.
	 */
	function handleDelete(
		event: Event,
		value: RichTextValue,
		isReverse: boolean
	) {
		const { onMerge, onRemove } = props.current;
		const { start, end, text } = value;

		// Only process delete if it occurs at a collapsed edge.
		if (
			! isCollapsed( value ) ||
			( isReverse && start !== 0 ) ||
			( ! isReverse && end !== text.length )
		) {
			return;
		}

		if ( onMerge ) {
			onMerge( ! isReverse );
		}

		// Only handle remove on Backspace. This serves dual-purpose of being
		// an intentional user interaction distinguishing between Backspace and
		// Delete to remove the empty field, but also to avoid merge & remove
		// causing destruction of two fields (merge, then removed merged).
		else if ( onRemove && isEmpty( value ) && isReverse ) {
			onRemove( ! isReverse );
		}

		event.preventDefault();
	}

	function onKeyDown( event: KeyboardEvent ) {
		const { keyCode } = event;

		if (
			event.defaultPrevented ||
			( keyCode !== DELETE && keyCode !== BACKSPACE )
		) {
			return;
		}

		handleDelete( event, props.current.value, keyCode === BACKSPACE );
	}

	// Deletes that don't arrive as a Backspace or Delete key press, such as
	// Ctrl+H on macOS, only show up as `beforeinput`.
	function onBeforeInput( event: InputEvent ) {
		const { inputType } = event;
		const isReverse = inputType.endsWith( 'Backward' );

		if (
			event.defaultPrevented ||
			! inputType.startsWith( 'delete' ) ||
			( ! isReverse && ! inputType.endsWith( 'Forward' ) )
		) {
			return;
		}

		// The rendered value can lag the record: the selection is synced in
		// the capture phase of this event, before a re-render.
		handleDelete( event, props.current.getValue(), isReverse );
	}

	const unsubscribeKeyDown = subscribeOwnedListener(
		element,
		'keydown',
		onKeyDown
	);
	const unsubscribeBeforeInput = subscribeOwnedListener(
		element,
		'beforeinput',
		onBeforeInput
	);

	return () => {
		unsubscribeKeyDown();
		unsubscribeBeforeInput();
	};
};

export default deleteListener;
