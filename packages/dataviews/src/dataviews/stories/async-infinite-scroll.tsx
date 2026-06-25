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
// Simulated per-page network latency. The jump only reproduces while the user
// keeps scrolling *during* this window, so it is deliberately long enough to
// scroll within — both by hand and from the `play` function.
const LOAD_DELAY_MS = 1000;

/**
 * Reproduces a real-world infinite-scroll consumer (e.g. a notifications list)
 * that the static `InfiniteScroll` story does not: pages are revealed one at a
 * time *asynchronously* and `isLoading` toggles for each page.
 *
 * The bug: the scroll handler captures a scroll-anchor the instant it advances
 * the window, but the anchor is only restored on a later render gated on
 * `isLoading`. When pages load over the network the user keeps scrolling in that
 * gap, and the restoration can't tell that user-driven movement from a
 * content-driven shift — so it "corrects" it, snapping the list back to where
 * the anchor sat at capture time and undoing the scrolling done while loading.
 *
 * Scroll down continuously (the HUD shows the live `scrollTop`): on `trunk` the
 * number jerks back upward as each page settles; with the fix it keeps climbing.
 * The `play` function in `index.story.tsx` reproduces and asserts this without
 * relying on hand-timed scrolling.
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

	// A "server" that reveals rows one page at a time, asynchronously, keeping
	// two pages buffered ahead of the scroll window. The buffer is what gives the
	// user rows to scroll into while the next page is still loading — i.e. the
	// async gap the anchor restoration mishandles.
	const [ loadedCount, setLoadedCount ] = useState( PAGE );
	const [ isLoading, setIsLoading ] = useState( false );
	const loadingRef = useRef( false );

	const loadedData = useMemo(
		() => data.slice( 0, loadedCount ),
		[ loadedCount ]
	);
	const { data: shownData, paginationInfo } = useMemo(
		() => filterSortAndPaginate( loadedData, view, fields ),
		[ loadedData, view ]
	);

	const startPosition = view.startPosition ?? 1;
	useEffect( () => {
		if (
			startPosition + PAGE * 2 <= loadedCount ||
			loadingRef.current ||
			loadedCount >= data.length
		) {
			return undefined;
		}
		loadingRef.current = true;
		setIsLoading( true );
		const timer = setTimeout( () => {
			setLoadedCount( ( count ) =>
				Math.min( count + PAGE, data.length )
			);
			setIsLoading( false );
			loadingRef.current = false;
		}, LOAD_DELAY_MS );
		return () => clearTimeout( timer );
	}, [ startPosition, loadedCount ] );

	// Live scroll-position read-out so the jump is observable as a number, not
	// just a flicker. The scrollable element is the internal
	// `.dataviews-layout__container`; scroll events don't bubble but do fire in
	// the capture phase, so we can observe it from the wrapper.
	const wrapperRef = useRef< HTMLDivElement >( null );
	const [ scrollTop, setScrollTop ] = useState( 0 );
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
				setScrollTop( Math.round( target.scrollTop ) );
			}
		};
		wrapper.addEventListener( 'scroll', onScroll, true );
		return () => wrapper.removeEventListener( 'scroll', onScroll, true );
	}, [] );

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
				{ `scrollTop: ${ scrollTop }px\n${
					isLoading ? 'loading next page…' : 'idle'
				}\nloaded: ${ loadedCount } / ${ data.length }` }
			</div>
			<DataViews
				getItemId={ ( item ) => item.id.toString() }
				paginationInfo={ paginationInfo }
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
