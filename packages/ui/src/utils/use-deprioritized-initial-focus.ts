import type { Popover as _Popover } from '@base-ui/react/popover';
import { useRef } from '@wordpress/element';
import { tabbable } from 'tabbable';

/**
 * The `initialFocus` type shared by Base UI overlay popups (Dialog, Popover,
 * AlertDialog, etc.). We derive it from `Popover.Popup.Props` here, but it
 * is identical across all overlay components.
 */
type InitialFocus = _Popover.Popup.Props[ 'initialFocus' ];

type DeprioritizedInitialFocus = {
	resolvedInitialFocus: InitialFocus;
	popupRef: React.RefObject< HTMLDivElement >;
};

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
 * marked with any of the given data attributes (e.g. a close icon, a
 * library-managed scroll container), and an internal ref that must be
 * merged onto the popup element.
 *
 * When `initialFocus` is `undefined` or `true` (the default behavior),
 * the hook replaces it with a callback that:
 * 1. On touch interactions — focuses the popup element itself (preventing
 *    the virtual keyboard on Android), matching Base UI's default.
 * 2. On other interactions — returns the first tabbable element that does
 *    *not* carry any of `deprioritizedAttributes`. Falls back to Base
 *    UI's default when every tabbable element is deprioritized.
 *
 * All other `initialFocus` values (`false`, `RefObject`, callback) pass
 * through unchanged.
 *
 * @param props
 * @param props.initialFocus            The consumer-provided `initialFocus` value.
 * @param props.deprioritizedAttributes The data attributes whose elements should be deprioritized.
 */
export function useDeprioritizedInitialFocus( {
	initialFocus,
	deprioritizedAttributes,
}: {
	initialFocus: InitialFocus;
	deprioritizedAttributes: string[];
} ): DeprioritizedInitialFocus {
	const popupRef = useRef< HTMLDivElement >( null );

	// Returning a fresh callback on every render is intentional. Base UI
	// stores `initialFocus` via `useValueAsRef` (see its FloatingFocusManager
	// source) and reads it through `ref.current` only at open time, so
	// reference identity doesn't affect behavior. Skipping `useMemo` also
	// avoids either forcing callers to memoize their attributes array or
	// fighting the React Compiler with a stringified dep key.
	let resolvedInitialFocus: InitialFocus = initialFocus;
	if ( initialFocus === undefined || initialFocus === true ) {
		resolvedInitialFocus = ( interactionType ) => {
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
					! deprioritizedAttributes.some( ( attr ) =>
						el.hasAttribute( attr )
					)
				) {
					return el;
				}
			}

			return true;
		};
	}

	return { resolvedInitialFocus, popupRef };
}
