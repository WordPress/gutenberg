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
 * - `false` is forwarded as-is to skip focus-on-mount entirely.
 * - `'firstInputElement'` returns a callback that resolves to the first
 *   focusable input/select/textarea inside `contentRef`, falling back to
 *   the popup's smart default if no match is found.
 * - All other values (`'firstContentElement'`, `'firstElement'`, `true`)
 *   defer to the popup's smart default, which already skips the close icon
 *   and focuses the first content tabbable.
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
