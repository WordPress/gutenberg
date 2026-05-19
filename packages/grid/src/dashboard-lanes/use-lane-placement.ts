/**
 * WordPress dependencies
 */
import { useState, useLayoutEffect, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { computeLanePlacements } from './lane-placement';
import { GRID_ITEM_DATA_KEY } from '../shared/grid-item-key';

const DEFAULT_ROW_UNIT = 4;

function supportsGridLanes(): boolean {
	if ( typeof CSS === 'undefined' || ! CSS.supports ) {
		return false;
	}
	return CSS.supports( 'display', 'grid-lanes' );
}

function clampSpan( span: number | undefined ): number {
	if ( typeof span !== 'number' || ! Number.isFinite( span ) ) {
		return 1;
	}
	return Math.max( 1, Math.floor( span ) );
}

/**
 * Logical item passed to the hook. The renderer is responsible for
 * mounting a DOM node with `data-wp-grid-item-key={ item.key }` for each
 * entry; the hook will measure that node and produce inline styles.
 */
export type LaneItemInput = {
	key: string;
	span?: number;
	lane?: number;
};

export type UseLanePlacementInput = {
	items: ReadonlyArray< LaneItemInput >;
	lanes: number;
	gap: number;
	flowTolerance: number;
	/**
	 * Snap unit for `grid-row-start` / `grid-row-end: span N` math.
	 * Smaller values produce sharper placement at the cost of more
	 * implicit rows. Defaults to 4 (px).
	 */
	rowUnit?: number;
};

export type UseLanePlacementResult = {
	/**
	 * Inline styles to apply to each item, keyed by item key. On
	 * native (`display: grid-lanes`), entries carry only
	 * `gridColumn: span N`; the browser handles row placement. While
	 * polyfilling, entries also carry explicit `grid-column-start` /
	 * `grid-row-*` values.
	 */
	itemStyles: Map< string, React.CSSProperties >;

	/**
	 * `false` when the host browser supports `display: grid-lanes`
	 * natively. The hook avoids mounting any observers in that case.
	 */
	isPolyfilled: boolean;
};

/**
 * Hook that measures item heights and resolves their placement when
 * `display: grid-lanes` is unavailable, falling through to a no-op
 * pass when the host browser supports the feature natively.
 *
 * Usage from the renderer:
 *
 * ```tsx
 * const [ container, setContainer ] = useState< HTMLDivElement | null >( null );
 * const { itemStyles } = useLanePlacement( container, {
 *     items: layout,
 *     lanes: columns,
 *     gap: gapPx,
 *     flowTolerance: 16,
 * } );
 *
 * return (
 *     <div ref={ setContainer } style={ { display: 'grid-lanes', ... } }>
 *         { items.map( ( item ) => (
 *             <div
 *                 key={ item.key }
 *                 data-wp-grid-item-key={ item.key }
 *                 style={ itemStyles.get( item.key ) }
 *             >
 *                 { ... }
 *             </div>
 *         ) ) }
 *     </div>
 * );
 * ```
 *
 * @param container HTMLElement (or null pre-mount) hosting the items.
 * @param input     Logical items, lane count, gap, and tuning.
 * @return Per-item styles plus the `isPolyfilled` flag.
 */
export function useLanePlacement(
	container: HTMLElement | null,
	input: UseLanePlacementInput
): UseLanePlacementResult {
	// Detect once at mount. SSR returns `true` (CSS undefined); the
	// client-first render returns the real value. Either path produces
	// the same DOM until the polyfill effect runs (both emit
	// span-only styles), so there is no hydration mismatch.
	const [ isPolyfilled ] = useState( () => ! supportsGridLanes() );

	const [ itemStyles, setItemStyles ] = useState<
		Map< string, React.CSSProperties >
	>( () => new Map() );

	// Native pass-through: items only need their column span; the
	// browser handles row placement. Memoized so a stable items
	// array yields a stable Map identity.
	const nativeStyles = useMemo( () => {
		const map = new Map< string, React.CSSProperties >();
		for ( const item of input.items ) {
			map.set( item.key, {
				gridColumn: `span ${ clampSpan( item.span ) }`,
			} );
		}
		return map;
	}, [ input.items ] );

	// Stable signature of items for deps. Keys, spans, and explicit
	// lanes are the only fields that influence observer wiring or
	// placement, so we hash exactly those.
	const itemsSignature = useMemo( () => {
		return input.items
			.map(
				( item ) =>
					`${ item.key }/${ item.span ?? 1 }/${ item.lane ?? '' }`
			)
			.join( '\0' );
	}, [ input.items ] );

	// Stable array identity while placement-relevant fields match
	// `itemsSignature`, so the layout effect is not torn down on every
	// parent re-render that passes a fresh `items` reference.
	// eslint-disable-next-line react-hooks/exhaustive-deps -- `itemsSignature` encodes keys/spans/lanes; `input.items` reference often changes without placement changes.
	const itemsForPlacement = useMemo( () => input.items, [ itemsSignature ] );

	const { lanes, gap, flowTolerance, rowUnit } = input;

	useLayoutEffect( () => {
		if ( ! isPolyfilled || ! container ) {
			return;
		}
		if ( typeof ResizeObserver === 'undefined' ) {
			return;
		}

		const heights = new Map< string, number >();
		const observed = new Set< Element >();
		let cancelled = false;
		let rafId: number | null = null;

		const recompute = () => {
			if ( rafId !== null || cancelled ) {
				return;
			}
			// One layout per frame even when ResizeObserver and
			// MutationObserver fire in the same tick.
			rafId = requestAnimationFrame( () => {
				rafId = null;
				if ( cancelled ) {
					return;
				}
				const itemsWithHeight = itemsForPlacement.map( ( item ) => ( {
					key: item.key,
					span: clampSpan( item.span ),
					lane: item.lane,
					height: heights.get( item.key ) ?? 0,
				} ) );
				const result = computeLanePlacements( {
					items: itemsWithHeight,
					lanes,
					gap,
					flowTolerance,
				} );
				const effectiveRowUnit = Math.max(
					1,
					rowUnit ?? DEFAULT_ROW_UNIT
				);
				const next = new Map< string, React.CSSProperties >();
				for ( const item of itemsForPlacement ) {
					const placement = result.placements.get( item.key );
					if ( ! placement ) {
						continue;
					}
					const height = heights.get( item.key ) ?? 0;
					const rowStart =
						Math.floor( placement.top / effectiveRowUnit ) + 1;
					const rowSpan = Math.max(
						1,
						Math.ceil( height / effectiveRowUnit )
					);
					next.set( item.key, {
						gridColumnStart: placement.lane + 1,
						gridColumnEnd: `span ${ placement.span }`,
						gridRowStart: rowStart,
						gridRowEnd: `span ${ rowSpan }`,
					} );
				}
				setItemStyles( next );
			} );
		};

		const resizeObserver = new ResizeObserver( ( entries ) => {
			let changed = false;
			for ( const entry of entries ) {
				const key = ( entry.target as HTMLElement ).getAttribute(
					GRID_ITEM_DATA_KEY
				);
				if ( ! key ) {
					continue;
				}
				const newHeight = entry.contentRect.height;
				if ( heights.get( key ) !== newHeight ) {
					heights.set( key, newHeight );
					changed = true;
				}
			}
			if ( changed ) {
				recompute();
			}
		} );

		const refreshObserved = () => {
			const current = container.querySelectorAll(
				`[${ GRID_ITEM_DATA_KEY }]`
			);
			for ( const element of current ) {
				if ( ! observed.has( element ) ) {
					observed.add( element );
					resizeObserver.observe( element );
					const key = element.getAttribute( GRID_ITEM_DATA_KEY );
					if ( key ) {
						const rect = (
							element as HTMLElement
						 ).getBoundingClientRect();
						heights.set( key, rect.height );
					}
				}
			}
			for ( const element of observed ) {
				if ( ! container.contains( element ) ) {
					resizeObserver.unobserve( element );
					observed.delete( element );
				}
			}
		};

		// Children may mount, unmount, or change `data-wp-grid-item-key`
		// after the container exists (drag reorders, additions). The
		// mutation observer keeps the observed set in sync.
		const mutationObserver =
			typeof MutationObserver !== 'undefined'
				? new MutationObserver( () => {
						refreshObserved();
						recompute();
				  } )
				: null;
		if ( mutationObserver ) {
			mutationObserver.observe( container, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: [ GRID_ITEM_DATA_KEY ],
			} );
		}

		refreshObserved();
		recompute();

		return () => {
			cancelled = true;
			if ( rafId !== null ) {
				cancelAnimationFrame( rafId );
			}
			resizeObserver.disconnect();
			mutationObserver?.disconnect();
		};
	}, [
		container,
		isPolyfilled,
		lanes,
		gap,
		flowTolerance,
		rowUnit,
		itemsForPlacement,
	] );

	if ( ! isPolyfilled ) {
		return { itemStyles: nativeStyles, isPolyfilled: false };
	}
	if ( itemStyles.size === 0 ) {
		// Pre-measurement frame: emit native-shape styles so items
		// appear in their default span rather than collapsing to 1
		// column at the top-left.
		return {
			itemStyles: nativeStyles as Map< string, React.CSSProperties >,
			isPolyfilled: true,
		};
	}
	return { itemStyles, isPolyfilled: true };
}
