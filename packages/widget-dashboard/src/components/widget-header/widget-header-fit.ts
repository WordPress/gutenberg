/**
 * External dependencies
 */
import type { Ref } from 'react';

/**
 * WordPress dependencies
 */
import { useResizeObserver } from '@wordpress/compose';
import { createContext, useContext, useEffect } from '@wordpress/element';

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

	const ref = useResizeObserver< T >(
		( [ entry ] ) => {
			const { columnGap } = getComputedStyle(
				entry.target.parentElement as HTMLElement
			);

			registerReserved(
				id,
				( entry.borderBoxSize?.[ 0 ]?.inlineSize ?? 0 ) +
					( parseFloat( columnGap ) || 0 )
			);
		},
		{ box: 'border-box' }
	);

	useEffect(
		() => () => unregisterReserved( id ),
		[ id, unregisterReserved ]
	);

	return ref;
}

/**
 * Reserves a container's own padding and border from the header's fit budget.
 *
 * Observing the border box is what makes a padding change notify: it leaves
 * the content box untouched.
 *
 * @param {string} id Stable identifier for the reserving container.
 */
export function useReserveHeaderPadding< T extends HTMLElement = HTMLElement >(
	id: string
): Ref< T > {
	const { registerReserved, unregisterReserved } = useContext(
		WidgetHeaderReserveContext
	);

	const ref = useResizeObserver< T >(
		( [ entry ] ) => {
			const border = entry.borderBoxSize?.[ 0 ]?.inlineSize ?? 0;
			const content = entry.contentBoxSize?.[ 0 ]?.inlineSize ?? 0;

			registerReserved( id, Math.max( 0, border - content ) );
		},
		{ box: 'border-box' }
	);

	useEffect(
		() => () => unregisterReserved( id ),
		[ id, unregisterReserved ]
	);

	return ref;
}
