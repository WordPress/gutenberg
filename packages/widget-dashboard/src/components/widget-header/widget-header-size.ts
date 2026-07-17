/**
 * External dependencies
 */
import type { Ref } from 'react';

/**
 * WordPress dependencies
 */
import { useResizeObserver } from '@wordpress/compose';
import { createContext, useContext, useEffect } from '@wordpress/element';

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

interface WidgetHeaderReserve {
	registerReserved: ( id: string, width: number ) => void;
	unregisterReserved: ( id: string ) => void;
}

const WidgetHeaderReserveContext = createContext< WidgetHeaderReserve >( {
	registerReserved: () => {},
	unregisterReserved: () => {},
} );

export const WidgetHeaderReserveProvider = WidgetHeaderReserveContext.Provider;

/**
 * Reserves a trailing section's footprint from the header's fit budget.
 *
 * A section that sits beside the collapsible controls (the actions menu, and
 * whatever the header gains next) attaches the returned ref to its root. Its
 * measured width, plus the gap before it, is discounted from the space the
 * collapsible controls plan for, so no section overflows onto another.
 *
 * @param {string} id Stable identifier for the reserving section.
 */
export function useReserveHeaderSpace< T extends HTMLElement = HTMLElement >(
	id: string
): Ref< T > {
	const { registerReserved, unregisterReserved } = useContext(
		WidgetHeaderReserveContext
	);

	const ref = useResizeObserver< T >( ( [ entry ] ) => {
		const { columnGap } = getComputedStyle(
			entry.target.parentElement as HTMLElement
		);

		registerReserved(
			id,
			entry.contentRect.width + ( parseFloat( columnGap ) || 0 )
		);
	} );

	useEffect(
		() => () => unregisterReserved( id ),
		[ id, unregisterReserved ]
	);

	return ref;
}
