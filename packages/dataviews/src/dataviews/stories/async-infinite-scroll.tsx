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
// are enough rows to scroll through several infinite-scroll pages.
const data = Array.from( { length: 6 }, ( _, batch ) =>
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
// Simulated network latency per page. The jump reproduces when the user keeps
// scrolling during this window, so it needs to be long enough to scroll within.
const LOAD_DELAY_MS = 700;

/**
 * Reproduces a real-world infinite-scroll consumer (e.g. a notifications list)
 * that the static `InfiniteScroll` story does not: data is revealed one page at
 * a time *asynchronously* and `isLoading` toggles for each page. Scroll down
 * continuously and the list jumps upward as each page settles — the scroll
 * handler captures an anchor when it advances the window, but by the time the
 * page resolves and the anchor is "restored" the user has scrolled further, and
 * the restoration snaps back to the capture-time position, undoing that scroll.
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

	// A "server" that reveals rows one page at a time, asynchronously.
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

	// Keep two pages buffered ahead of the scroll window. The async gap below is
	// what lets the user keep scrolling while a page loads.
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

	return (
		<>
			<style>{ `
			.dataviews-wrapper {
				height: 600px;
				overflow: auto;
			}
		` }</style>
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
		</>
	);
};

export default AsyncInfiniteScroll;
