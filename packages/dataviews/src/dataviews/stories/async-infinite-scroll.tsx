/**
 * WordPress dependencies
 */
import { useState, useMemo, useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataViews from '../index';
import { LAYOUT_GRID, LAYOUT_LIST, LAYOUT_TABLE } from '../../constants';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';
import type { View } from '../../types';
import { actions, data as fixtureData, fields } from './fixtures';

// The fixtures only contain ~50 rows; repeat them (with unique ids) so there
// are enough rows to page through several times.
const data = Array.from( { length: 8 }, ( _, batch ) =>
	fixtureData.map( ( item ) => ( {
		...item,
		id: item.id + batch * 1000,
		name: {
			...item.name,
			title: `${ item.name.title } #${ batch + 1 }`,
		},
	} ) )
).flat();

const PAGE = 20;
// Simulated per-page network latency.
const LOAD_DELAY_MS = 800;

/**
 * A realistic network-backed infinite-scroll consumer (e.g. the experimental
 * media modal): there is no prefetch buffer. The hook drives pagination by
 * advancing `view.startPosition`; the consumer fetches exactly the window it was
 * asked for, toggling `isLoading` while that request is in flight, and reports
 * the *true* server total so the hook knows more remains.
 *
 * Use the HUD (top-right) to watch `scrollTop` / `scrollHeight` / `isLoading`
 * while reproducing.
 */
const AsyncInfiniteScroll = () => {
	const [ view, setView ] = useState< View >( {
		type: LAYOUT_LIST,
		search: '',
		startPosition: 1,
		perPage: PAGE,
		filters: [],
		fields: [ 'satellites' ],
		titleField: 'title',
		descriptionField: 'description',
		mediaField: 'image',
		infiniteScrollEnabled: true,
	} );

	// The "server": how many rows have been delivered so far, and whether a
	// request for the current window is in flight.
	const [ loadedCount, setLoadedCount ] = useState( PAGE );
	const [ isLoading, setIsLoading ] = useState( false );

	const startPosition = view.startPosition ?? 1;
	const perPage = view.perPage ?? PAGE;
	// Rows required to fill the window the hook is currently asking for.
	const needed = Math.min( startPosition - 1 + perPage, data.length );

	useEffect( () => {
		if ( needed <= loadedCount ) {
			return undefined;
		}
		setIsLoading( true );
		const timer = setTimeout( () => {
			setLoadedCount( needed );
			setIsLoading( false );
		}, LOAD_DELAY_MS );
		return () => clearTimeout( timer );
	}, [ needed, loadedCount ] );

	const loadedData = useMemo(
		() => data.slice( 0, loadedCount ),
		[ loadedCount ]
	);
	const { data: shownData, paginationInfo } = useMemo(
		() => filterSortAndPaginate( loadedData, view, fields ),
		[ loadedData, view ]
	);
	// Report the true server total (not just what's loaded) so infinite scroll
	// keeps requesting until the dataset is exhausted.
	const serverPaginationInfo = useMemo(
		() => ( { ...paginationInfo, totalItems: data.length } ),
		[ paginationInfo ]
	);

	// Live scroll-position read-out. The scrollable element is the internal
	// `.dataviews-layout__container`; scroll events don't bubble but do fire in
	// the capture phase, so we can observe it from the wrapper.
	const wrapperRef = useRef< HTMLDivElement >( null );
	const [ metrics, setMetrics ] = useState( {
		scrollTop: 0,
		scrollHeight: 0,
		clientHeight: 0,
	} );
	useEffect( () => {
		const wrapper = wrapperRef.current;
		if ( ! wrapper ) {
			return undefined;
		}
		const onScroll = ( event: Event ) => {
			const target = event.target as HTMLElement;
			if (
				target?.classList?.contains( 'dataviews-layout__container' )
			) {
				setMetrics( {
					scrollTop: Math.round( target.scrollTop ),
					scrollHeight: Math.round( target.scrollHeight ),
					clientHeight: Math.round( target.clientHeight ),
				} );
			}
		};
		wrapper.addEventListener( 'scroll', onScroll, true );
		return () => wrapper.removeEventListener( 'scroll', onScroll, true );
	}, [] );

	const distanceToBottom =
		metrics.scrollHeight - metrics.clientHeight - metrics.scrollTop;

	return (
		<div
			ref={ wrapperRef }
			data-testid="async-infinite-scroll"
			data-loading={ isLoading ? 'true' : 'false' }
			data-loaded-count={ loadedCount }
			style={ { position: 'relative' } }
		>
			<style>{ `
			.dataviews-wrapper {
				height: 600px;
				overflow: auto;
			}
		` }</style>
			<div
				aria-hidden="true"
				style={ {
					position: 'absolute',
					top: 8,
					right: 8,
					zIndex: 10,
					padding: '6px 10px',
					borderRadius: 4,
					font: '12px/1.5 monospace',
					whiteSpace: 'pre',
					background: isLoading ? '#b32d2e' : '#1e1e1e',
					color: '#fff',
					pointerEvents: 'none',
				} }
			>
				{ `${
					isLoading ? 'loading…' : 'idle'
				}\nloaded: ${ loadedCount } / ${
					data.length
				}\nstartPosition: ${ startPosition }\nscrollTop: ${
					metrics.scrollTop
				}\nscrollHeight: ${
					metrics.scrollHeight
				}\nto bottom: ${ distanceToBottom }px` }
			</div>
			<DataViews
				getItemId={ ( item ) => item.id.toString() }
				paginationInfo={ serverPaginationInfo }
				data={ shownData }
				view={ view }
				fields={ fields }
				onChangeView={ setView }
				isLoading={ isLoading }
				actions={ actions }
				defaultLayouts={ {
					[ LAYOUT_TABLE ]: true,
					[ LAYOUT_GRID ]: true,
					[ LAYOUT_LIST ]: true,
				} }
			/>
		</div>
	);
};

export default AsyncInfiniteScroll;
