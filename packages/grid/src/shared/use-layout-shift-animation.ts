/**
 * WordPress dependencies
 */
import { useCallback, useLayoutEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { GRID_ITEM_DATA_KEY } from './grid-item-key';

/* `left`/`top` are relative to the grid container, not the viewport. */
export type RectSnapshot = {
	left: number;
	top: number;
	width: number;
	height: number;
};

type UseLayoutShiftAnimationOptions = {
	/**
	 * Surface root that contains grid tiles.
	 */
	container: HTMLElement | null;

	/**
	 * When false, snapshots are cleared and no transforms run.
	 */
	enabled: boolean;

	/**
	 * Serialized layout/placement state. The hook runs FLIP when this
	 * value changes while `enabled` is true.
	 */
	layoutFingerprint: string;

	/**
	 * Item key to skip (the tile being dragged or resized).
	 */
	excludeItemKey?: string | null;
};

type UseLayoutShiftAnimationResult = {
	/**
	 * Capture tile positions synchronously **before** a layout update
	 * (call immediately before `setTemporaryLayout` / similar).
	 */
	captureLayoutSnapshot: () => void;

	/**
	 * Container-relative rects from the last committed paint (settled, no
	 * FLIP invert transforms).
	 */
	getLastPositions: () => ReadonlyMap< string, RectSnapshot > | null;

	/**
	 * Tile positions immediately before the latest layout commit. Used
	 * by item-exit animation when keys drop out of `layout`.
	 */
	getPositionsBeforeLastChange: () => ReadonlyMap<
		string,
		RectSnapshot
	> | null;
};

function queryGridItems( container: HTMLElement ): HTMLElement[] {
	return Array.from(
		container.querySelectorAll< HTMLElement >(
			`[${ GRID_ITEM_DATA_KEY }]:not([data-wp-grid-item-exiting])`
		)
	);
}

function readItemKey( element: HTMLElement ): string | null {
	return element.getAttribute( GRID_ITEM_DATA_KEY );
}

function snapshotPositions(
	container: HTMLElement
): Map< string, RectSnapshot > {
	// Measure relative to the container so positions stay valid even if the
	// page scroll shifts between capture and use (e.g. the document reflowing
	// shorter after a tile is removed).
	const base = container.getBoundingClientRect();
	const positions = new Map< string, RectSnapshot >();
	for ( const element of queryGridItems( container ) ) {
		const key = readItemKey( element );
		if ( ! key ) {
			continue;
		}
		const { left, top, width, height } = element.getBoundingClientRect();
		positions.set( key, {
			left: left - base.left,
			top: top - base.top,
			width,
			height,
		} );
	}
	return positions;
}

function clearLayoutShiftStyles( element: HTMLElement ): void {
	element.style.removeProperty( 'transform' );
	element.style.removeProperty( 'transition' );
}

function playLayoutShift(
	element: HTMLElement,
	deltaX: number,
	deltaY: number
): void {
	if ( deltaX === 0 && deltaY === 0 ) {
		return;
	}

	// Invert: show the tile where it was before the layout change.
	element.style.transition = 'none';
	element.style.transform = `translate(${ deltaX }px, ${ deltaY }px)`;
	void element.offsetHeight;

	// Play on the next frame so the inverted transform paints before
	// the transition back to the committed grid position.
	requestAnimationFrame( () => {
		element.style.removeProperty( 'transition' );
		element.style.transform = '';

		const onTransitionEnd = ( event: TransitionEvent ) => {
			if ( event.propertyName !== 'transform' ) {
				return;
			}
			element.removeEventListener( 'transitionend', onTransitionEnd );
			clearLayoutShiftStyles( element );
		};
		element.addEventListener( 'transitionend', onTransitionEnd );
	} );
}

/**
 * Animates sibling tiles when grid layout reflows during drag or resize
 * using a FLIP transform (see `layout-shift-animation.module.css`).
 *
 * @param root0                   Hook options.
 * @param root0.container         Surface root that contains grid tiles.
 * @param root0.enabled           When false, snapshots are cleared and no transforms run.
 * @param root0.layoutFingerprint Serialized layout/placement state.
 * @param root0.excludeItemKey    Item key to skip (the tile being dragged or resized).
 * @return Snapshot capture callback for use before layout updates.
 */
export function useLayoutShiftAnimation( {
	container,
	enabled,
	layoutFingerprint,
	excludeItemKey = null,
}: UseLayoutShiftAnimationOptions ): UseLayoutShiftAnimationResult {
	const snapshotBeforeChangeRef = useRef< Map<
		string,
		RectSnapshot
	> | null >( null );
	const lastRenderedPositionsRef = useRef< Map<
		string,
		RectSnapshot
	> | null >( null );
	const positionsBeforeLastChangeRef = useRef< Map<
		string,
		RectSnapshot
	> | null >( null );

	const captureLayoutSnapshot = useCallback( () => {
		if ( container ) {
			snapshotBeforeChangeRef.current = snapshotPositions( container );
		}
	}, [ container ] );

	useLayoutEffect( () => {
		if ( ! container || ! enabled ) {
			snapshotBeforeChangeRef.current = null;
			lastRenderedPositionsRef.current = null;
			positionsBeforeLastChangeRef.current = null;
			if ( container ) {
				for ( const element of queryGridItems( container ) ) {
					clearLayoutShiftStyles( element );
				}
			}
			return;
		}

		for ( const element of queryGridItems( container ) ) {
			clearLayoutShiftStyles( element );
		}

		const previous =
			snapshotBeforeChangeRef.current ?? lastRenderedPositionsRef.current;
		snapshotBeforeChangeRef.current = null;

		positionsBeforeLastChangeRef.current = previous
			? new Map( previous )
			: null;

		// Record settled grid positions for the next FLIP. Must run before
		// invert transforms — measuring after `playLayoutShift` would bake
		// translate offsets into the baseline and skew the next animation.
		lastRenderedPositionsRef.current = snapshotPositions( container );

		if ( previous ) {
			const base = container.getBoundingClientRect();
			for ( const element of queryGridItems( container ) ) {
				const key = readItemKey( element );
				if ( ! key || key === excludeItemKey ) {
					continue;
				}
				const old = previous.get( key );
				if ( ! old ) {
					continue;
				}
				const { left, top } = element.getBoundingClientRect();
				const deltaX = old.left - ( left - base.left );
				const deltaY = old.top - ( top - base.top );
				playLayoutShift( element, deltaX, deltaY );
			}
		}
	}, [ container, enabled, layoutFingerprint, excludeItemKey ] );

	const getLastPositions = useCallback( () => {
		return lastRenderedPositionsRef.current;
	}, [] );

	const getPositionsBeforeLastChange = useCallback( () => {
		return positionsBeforeLastChangeRef.current;
	}, [] );

	return {
		captureLayoutSnapshot,
		getLastPositions,
		getPositionsBeforeLastChange,
	};
}

/**
 * Stable fingerprint for {@link useLayoutShiftAnimation}. Width/height
 * values may be numbers or layout keywords (`'fill'`, `'full'`).
 *
 * @param layout Layout items to serialize.
 * @return Fingerprint string.
 */
export function getLayoutFingerprint(
	layout: ReadonlyArray< {
		key: string;
		width?: number | string;
		height?: number;
		order?: number;
		lane?: number;
	} >
): string {
	return layout
		.map(
			( item ) =>
				`${ item.key }:${ String( item.width ?? '' ) }:${
					item.height ?? 1
				}:${ item.order ?? '' }:${ item.lane ?? '' }`
		)
		.join( '|' );
}

/**
 * Placement fingerprint for lanes polyfill / explicit grid positions.
 *
 * @param itemStyles Per-item inline placement styles.
 * @return Fingerprint string.
 */
export function getPlacementFingerprint(
	itemStyles: Map< string, React.CSSProperties >
): string {
	return [ ...itemStyles.entries() ]
		.sort( ( [ a ], [ b ] ) => a.localeCompare( b ) )
		.map( ( [ key, style ] ) => {
			const column = style.gridColumn ?? '';
			const columnStart = style.gridColumnStart ?? '';
			const rowStart = style.gridRowStart ?? '';
			const rowEnd = style.gridRowEnd ?? '';
			return `${ key }:${ String( column ) }:${ String(
				columnStart
			) }:${ String( rowStart ) }:${ String( rowEnd ) }`;
		} )
		.join( '|' );
}
