/**
 * WordPress dependencies
 */
import { useResizeObserver, useMergeRefs } from '@wordpress/compose';
import {
	useLayoutEffect,
	useMemo,
	useState,
	type Ref,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { resolveDashboardColumnCount } from '../utils/resolve-dashboard-column-count/resolve-dashboard-column-count';

/**
 * Tracks the dashboard grid container width and maps it to an opinionated
 * column count (4 → 2 → 1). Measurement is container-based via
 * `ResizeObserver`, not viewport media queries.
 *
 * @param forwardedRef Optional ref forwarded from the grid wrapper.
 * @return Merged ref for the container element and the resolved column count.
 */
export function useDashboardContainerColumnCount(
	forwardedRef?: Ref< HTMLDivElement >
): {
	containerRef: Ref< HTMLDivElement >;
	columnCount: number;
} {
	const [ container, setContainer ] = useState< HTMLDivElement | null >(
		null
	);
	const [ containerWidth, setContainerWidth ] = useState( 0 );

	const resizeObserverRef = useResizeObserver( ( [ { contentRect } ] ) => {
		setContainerWidth( contentRect.width );
	} );

	const containerRef = useMergeRefs( [
		setContainer,
		resizeObserverRef,
		forwardedRef,
	] );

	useLayoutEffect( () => {
		if ( ! container ) {
			return;
		}
		const { width } = container.getBoundingClientRect();
		if ( width > 0 ) {
			setContainerWidth( width );
		}
	}, [ container ] );

	const columnCount = useMemo(
		() => resolveDashboardColumnCount( containerWidth ),
		[ containerWidth ]
	);

	return { containerRef, columnCount };
}
