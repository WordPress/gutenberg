/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Inline size (px) the header keeps for the identity cluster before the
 * toolbar may claim the rest: the identity's CSS truncation floor (see
 * `.identity` in the header styles) plus the identity/toolbar gap.
 */
export const WIDGET_HEADER_IDENTITY_RESERVE = 128;

/**
 * Horizontal padding of the toolbar chip (`--wpds-dimension-padding-xs` per
 * side). Part of the header budget in both header variants, with and
 * without identity.
 */
export const WIDGET_TOOLBAR_CHIP_RESERVE = 8;

const WidgetHeaderAvailableSizeContext = createContext< number | null >( null );

export const WidgetHeaderAvailableSizeProvider =
	WidgetHeaderAvailableSizeContext.Provider;

/**
 * Inline size (px) the header row can still grant its toolbar, or `null`
 * while unmeasured or outside a header. Toolbar controls compare their
 * natural width against it to pick a presentation that fits.
 */
export function useWidgetHeaderAvailableSize(): number | null {
	return useContext( WidgetHeaderAvailableSizeContext );
}
