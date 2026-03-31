import type { Dialog as _Dialog } from '@base-ui/react/dialog';
import { useMemo, useRef } from '@wordpress/element';
import { tabbable } from 'tabbable';

/**
 * Derived from Base UI's `Dialog.Popup.Props['initialFocus']`.
 * The same type is shared by all Base UI overlay popups (Dialog, Popover, etc.).
 */
type InitialFocus = _Dialog.Popup.Props[ 'initialFocus' ];

/**
 * Options matching Base UI's internal tabbable configuration.
 * @see https://github.com/floating-ui/floating-ui/blob/master/packages/react/src/utils/tabbable.ts
 */
const getTabbableOptions = () => ( {
	getShadowRoot: true,
	displayCheck:
		typeof ResizeObserver === 'function' &&
		ResizeObserver.toString().includes( '[native code]' )
			? ( 'full' as const )
			: ( 'none' as const ),
} );

/**
 * Returns a resolved `initialFocus` value that deprioritizes elements
 * marked with a given data attribute (e.g. a close icon), and an internal
 * ref that must be merged onto the popup element.
 *
 * When `initialFocus` is `undefined` or `true` (the default behavior),
 * the hook replaces it with a callback that:
 * 1. On touch interactions — focuses the popup element itself (preventing
 *    the virtual keyboard on Android), matching Base UI's default.
 * 2. On other interactions — returns the first tabbable element that does
 *    *not* carry `deprioritizedAttribute`. Falls back to Base UI's default
 *    when the deprioritized element is the only tabbable element.
 *
 * All other `initialFocus` values (`false`, `RefObject`, callback) pass
 * through unchanged.
 *
 * @param props
 * @param props.initialFocus           The consumer-provided `initialFocus` value.
 * @param props.deprioritizedAttribute The data attribute whose elements should be deprioritized.
 */
export function useDeprioritizedInitialFocus( {
	initialFocus,
	deprioritizedAttribute,
}: {
	initialFocus: InitialFocus;
	deprioritizedAttribute: string;
} ) {
	const popupRef = useRef< HTMLDivElement >( null );

	const resolvedInitialFocus = useMemo( (): InitialFocus => {
		if ( initialFocus !== undefined && initialFocus !== true ) {
			return initialFocus;
		}

		return ( interactionType ): HTMLElement | boolean | null => {
			if ( interactionType === 'touch' ) {
				return popupRef.current ?? true;
			}

			const popup = popupRef.current;
			if ( ! popup ) {
				return true;
			}

			const tabbables = tabbable( popup, getTabbableOptions() );
			for ( const el of tabbables ) {
				if (
					el instanceof HTMLElement &&
					! el.hasAttribute( deprioritizedAttribute )
				) {
					return el;
				}
			}

			return true;
		};
	}, [ initialFocus, deprioritizedAttribute ] );

	return { resolvedInitialFocus, popupRef };
}
