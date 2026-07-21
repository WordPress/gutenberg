/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Inline size (px) of the gap the header row places between the identity
 * cluster and the toolbar (`--wpds-dimension-gap-sm`). Added to the measured
 * identity width so the toolbar budget reflects the space the identity
 * actually occupies, whatever it renders (icon, title, info tooltip, …),
 * rather than a fixed reserve that assumes a single layout.
 */
export const WIDGET_HEADER_IDENTITY_GAP = 8;

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
