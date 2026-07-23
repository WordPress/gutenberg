/**
 * WordPress dependencies
 */
import { useState, useMemo, useEffect } from '@wordpress/element';

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
 * A realistic network-backed infinite-scroll consumer: the hook advances
 * `view.startPosition`, and the consumer fetches that window asynchronously
 * (toggling `isLoading`) while reporting the true server total.
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

	return (
		<div style={ { height: '100%' } }>
			<style>{ `
			.dataviews-wrapper {
				height: 100%;
				overflow: auto;
			}
		` }</style>
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
