import { useEffect } from '@wordpress/element';
import { isTextField } from '@wordpress/dom';

/**
 * How long after a keystroke a field's history edit is still attributed to
 * it. Covers fields that commit to the history on a short debounce.
 */
const SETTLE_DELAY = 500;

/**
 * Text fields observed while typing, mapped to whether their typing reached
 * the editor history (`true`) or stayed in the field (`false`).
 */
const fieldHistory = new WeakMap< Element, boolean >();

/**
 * Cancels the pending debounce check of a field judged local.
 */
const pendingChecks = new WeakMap< Element, () => void >();

/**
 * Observes typing in text fields to learn, per field, whether its text is
 * part of the editor history. A keystroke that changes a field's value
 * without changing the history means the field keeps its text locally (a
 * dialog input, a search field), so the browser's own undo must act on it.
 *
 * Mount once, where the undo and redo shortcuts are handled.
 *
 * @param getRevision Returns a value that changes whenever the history does.
 */
export function useFieldHistoryTracking( getRevision: () => unknown ) {
	useEffect( () => {
		function onKeyDown( event: KeyboardEvent ) {
			// Shortcuts do not type. Undo and redo themselves change the value
			// and must not reclassify the field.
			if ( event.metaKey || event.ctrlKey ) {
				return;
			}

			const target = event.target as Element | null | undefined;
			// Canvas key events are re-dispatched on the iframe element, so
			// the real target is the frame's focused element.
			const field =
				target?.nodeName === 'IFRAME'
					? ( target as HTMLIFrameElement ).contentDocument
							?.activeElement
					: target;

			// A field known to edit the history stays so, and block rich text
			// always does, so neither needs observing.
			if (
				! field ||
				! isTextField( field ) ||
				fieldHistory.get( field ) ||
				field.classList.contains( 'block-editor-rich-text__editable' )
			) {
				return;
			}

			// A later keystroke starts its own check.
			pendingChecks.get( field )?.();

			// Enter in a single line field submits or commits rather than
			// types, so a history edit following it is not the field's own.
			// An Enter confirming an IME composition types; Safari reports
			// it as not composing, so it is detected by its key code.
			if (
				event.key === 'Enter' &&
				field.nodeName === 'INPUT' &&
				! event.isComposing &&
				event.keyCode !== 229
			) {
				return;
			}

			const value =
				( field as HTMLInputElement ).value ?? field.textContent;
			const revision = getRevision();
			const { defaultView } = field.ownerDocument;

			// React applies the change within the input event, so the history
			// has already moved by the next task if the field edits it.
			defaultView?.setTimeout( () => {
				if (
					( ( field as HTMLInputElement ).value ??
						field.textContent ) === value
				) {
					return;
				}

				if ( getRevision() !== revision ) {
					fieldHistory.set( field, true );
					return;
				}

				fieldHistory.set( field, false );

				// A field that commits on a debounce edits the history later,
				// while it keeps the typed value and focus. A history edit
				// after leaving the field is not its own.
				const typedValue =
					( field as HTMLInputElement ).value ?? field.textContent;
				const timeout = defaultView.setTimeout( () => {
					cancel();
					if (
						getRevision() !== revision &&
						( ( field as HTMLInputElement ).value ??
							field.textContent ) === typedValue
					) {
						fieldHistory.set( field, true );
					}
				}, SETTLE_DELAY );
				const cancel = () => {
					defaultView.clearTimeout( timeout );
					field.removeEventListener( 'blur', cancel );
					pendingChecks.delete( field );
				};
				field.addEventListener( 'blur', cancel );
				pendingChecks.set( field, cancel );
			} );
		}

		// Capture, so fields that stop propagation are still observed. Canvas
		// key events arrive here re-dispatched on the iframe element.
		document.addEventListener( 'keydown', onKeyDown, true );
		return () => {
			document.removeEventListener( 'keydown', onKeyDown, true );
		};
	}, [ getRevision ] );
}

/**
 * Returns true when the editor history must leave the undo or redo shortcut
 * of this event to the browser: the event comes from a text field whose
 * typing does not reach the editor history.
 *
 * A text field not typed in yet is left to the browser, except an editable
 * region (rich text), which edits the history directly.
 *
 * @param event Keyboard event.
 *
 * @return Whether the element relies on the browser's own undo.
 */
export function usesNativeUndo( event: KeyboardEvent ): boolean {
	const target = event.target as Element | null | undefined;
	// Canvas key events are re-dispatched on the iframe element, so the real
	// target is the frame's focused element.
	const field =
		target?.nodeName === 'IFRAME'
			? ( target as HTMLIFrameElement ).contentDocument?.activeElement
			: target;

	if ( ! field || ! isTextField( field ) ) {
		return false;
	}

	const isInHistory = fieldHistory.get( field );

	if ( isInHistory !== undefined ) {
		return ! isInHistory;
	}

	return field.nodeName === 'INPUT' || field.nodeName === 'TEXTAREA';
}
