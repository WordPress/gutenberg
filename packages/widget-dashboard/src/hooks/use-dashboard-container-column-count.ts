import { useResizeObserver, useMergeRefs } from '@wordpress/compose';
import {
	useLayoutEffect,
	useMemo,
	useState,
	type Ref,
} from '@wordpress/element';
import { resolveDashboardColumnCount } from '../utils/resolve-dashboard-column-count/resolve-dashboard-column-count';

interface UseDashboardContainerColumnCountResult {
	containerRef: Ref< HTMLDivElement >;
	columnCount: number;
}

/**
 * Tracks the dashboard grid container width and maps it to an opinionated
 * column count (cap → 2 → 1). Measurement is container-based via
 * `ResizeObserver`, not viewport media queries.
 *
 * @param {Ref< HTMLDivElement >} [forwardedRef] Ref forwarded from the grid wrapper.
 * @param {number}                [maxColumns]   Column cap for wide containers.
 */
export function useDashboardContainerColumnCount(
	forwardedRef?: Ref< HTMLDivElement >,
	maxColumns?: number
): UseDashboardContainerColumnCountResult {
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
		forwardedRef ?? null,
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
		() => resolveDashboardColumnCount( containerWidth, maxColumns ),
		[ containerWidth, maxColumns ]
	);

	return { containerRef, columnCount };
}
