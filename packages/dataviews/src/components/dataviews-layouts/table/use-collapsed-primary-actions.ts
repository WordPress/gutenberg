import type { RefObject } from 'react';
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';

export const COLLAPSED_PRIMARY_ACTIONS_CLASS = 'has-collapsed-primary-actions';

/**
 * Decides whether the table shows primary actions inline or collapses them
 * into the actions menu, depending on the space available.
 *
 * Primary actions are shown only when the table, laid out at its natural
 * (max-content) width with primary actions visible, fits the container. So
 * the actions column never takes space from the data columns: when there's
 * not enough room for every column at its natural width plus the primary
 * actions, they are collapsed and the column holds just the menu button.
 *
 * The measurement is always taken with primary actions visible, regardless
 * of the current state, so the result doesn't depend on it and can't flip back
 * and forth. It's done synchronously by toggling the class and the table width
 * on the DOM and restoring them before the browser paints.
 *
 * @param params              The parameters for the hook.
 * @param params.tableRef     The ref to the table element.
 * @param params.containerRef The ref to the element whose width is available.
 * @param params.enabled      Whether there are primary actions to collapse.
 * @param params.contentDeps  Values that may change the table's natural width
 *                            (data, fields, view…); compared item by item.
 * @return Whether primary actions are collapsed.
 */
export function useCollapsedPrimaryActions( {
	tableRef,
	containerRef,
	enabled,
	contentDeps,
}: {
	tableRef: RefObject< HTMLTableElement | null >;
	containerRef: RefObject< HTMLDivElement | null >;
	enabled: boolean;
	contentDeps: unknown[];
} ): boolean {
	const [ isCollapsed, setIsCollapsed ] = useState( false );

	const measure = useCallback( () => {
		const table = tableRef.current;
		const container = containerRef.current;
		if ( ! enabled || ! table || ! container ) {
			setIsCollapsed( false );
			return;
		}

		const wasCollapsed = table.classList.contains(
			COLLAPSED_PRIMARY_ACTIONS_CLASS
		);
		const previousWidth = table.style.width;
		table.classList.remove( COLLAPSED_PRIMARY_ACTIONS_CLASS );
		table.style.width = 'max-content';
		const neededWidth = table.getBoundingClientRect().width;
		table.style.width = previousWidth;
		if ( wasCollapsed ) {
			table.classList.add( COLLAPSED_PRIMARY_ACTIONS_CLASS );
		}

		// Round up to absorb sub-pixel differences between the two values.
		setIsCollapsed( Math.ceil( neededWidth ) > container.clientWidth );
	}, [ tableRef, containerRef, enabled ] );

	// Re-measure before paint whenever the content may have changed.
	const previousDepsRef = useRef< unknown[] >( undefined );
	useLayoutEffect( () => {
		const previousDeps = previousDepsRef.current;
		previousDepsRef.current = contentDeps;
		if (
			previousDeps &&
			previousDeps.length === contentDeps.length &&
			previousDeps.every( ( dep, index ) => dep === contentDeps[ index ] )
		) {
			return;
		}
		measure();
	} );
	// Also re-measure when the measuring conditions change.
	useLayoutEffect( measure, [ measure ] );

	// Re-measure when the available width changes.
	useEffect( () => {
		const container = containerRef.current;
		if ( ! enabled || ! container ) {
			return;
		}
		const view = container.ownerDocument.defaultView;
		if ( ! view?.ResizeObserver ) {
			return;
		}
		let lastWidth = container.clientWidth;
		const observer = new view.ResizeObserver( () => {
			// Only width matters; ignore height changes (e.g. pagination).
			if ( container.clientWidth !== lastWidth ) {
				lastWidth = container.clientWidth;
				measure();
			}
		} );
		observer.observe( container );
		return () => observer.disconnect();
	}, [ containerRef, enabled, measure ] );

	return enabled && isCollapsed;
}
