/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import type { RefObject } from 'react';

/**
 * Internal dependencies
 */
import type { ActionModal } from '../types';

const FIRST_INPUT_SELECTOR =
	'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])';

/**
 * Maps the legacy `Modal.focusOnMount` semantics onto the
 * `Dialog.Popup.initialFocus` prop accepted by `@wordpress/ui`.
 *
 * Mapping for each of the five legacy values that `ActionModal.modalFocusOnMount`
 * accepts (`Parameters< typeof useFocusOnMount >[ 0 ] | 'firstContentElement'`):
 *
 * - `false` — forwarded as-is to skip focus-on-mount entirely.
 * - `'firstInputElement'` — returns a callback that resolves to the first
 *   focusable `<input>` / `<select>` / `<textarea>` inside `contentRef`,
 *   falling back to the popup's smart default if no match is found.
 * - `'firstContentElement'` — defers to the popup's smart default (which
 *   already skips the close icon and focuses the first content tabbable).
 * - `'firstElement'` — same as `'firstContentElement'` under the new Dialog
 *   primitive. The legacy distinction (focus first focusable, including the
 *   close icon) is no longer meaningful because the popup's smart default
 *   already skips the close icon.
 * - `true` (the default) — defers to the popup's smart default.
 *
 * Three of the five values converge on the popup's smart default; they're
 * still listed explicitly so that grepping the source for any of the legacy
 * string literals lands on this hook.
 *
 * @param focusOnMount Legacy `Modal.focusOnMount` value to translate.
 * @param contentRef   Ref to the popup body, used by the
 *                     `'firstInputElement'` callback to scope its query.
 * @return The mapped value to pass as `Dialog.Popup`'s `initialFocus`.
 */
export default function useMapFocusOnMount(
	focusOnMount: ActionModal< unknown >[ 'modalFocusOnMount' ],
	contentRef: RefObject< HTMLElement | null >
) {
	const focusFirstInput = useCallback( () => {
		if ( contentRef.current ) {
			const target =
				contentRef.current.querySelector< HTMLElement >(
					FIRST_INPUT_SELECTOR
				);
			if ( target ) {
				return target;
			}
		}
		return true as const;
	}, [ contentRef ] );

	if ( focusOnMount === false ) {
		return false;
	}
	if ( focusOnMount === 'firstInputElement' ) {
		return focusFirstInput;
	}
	return true;
}
