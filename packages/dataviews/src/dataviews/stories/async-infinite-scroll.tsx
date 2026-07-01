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
const INITIAL_VIEW: View = {
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
};

function getRequestKey( view: View ) {
	return JSON.stringify( {
		startPosition: view.startPosition ?? 1,
		perPage: view.perPage ?? PAGE,
		search: view.search ?? '',
		filters: view.filters ?? [],
		sort: view.sort,
		groupBy: view.groupBy,
	} );
}

function fetchWindow( view: View ) {
	return filterSortAndPaginate( data, view, fields );
}

/**
 * A realistic network-backed infinite-scroll consumer: the hook advances
 * `view.startPosition`, and the consumer fetches that window asynchronously
 * (toggling `isLoading`) while reporting the true server total.
 */
const AsyncInfiniteScroll = () => {
	const [ view, setView ] = useState< View >( INITIAL_VIEW );

	// The "server": only the currently requested window is cached, so scrolling
	// up has to re-fetch unloaded rows just like scrolling down fetches new ones.
	const [ fetchedRequestKey, setFetchedRequestKey ] = useState( () =>
		getRequestKey( INITIAL_VIEW )
	);
	const [ fetchedData, setFetchedData ] = useState(
		() => fetchWindow( INITIAL_VIEW ).data
	);
	const [ isLoading, setIsLoading ] = useState( false );

	const requestKey = getRequestKey( view );
	const isRequestLoaded = fetchedRequestKey === requestKey;

	useEffect( () => {
		if ( isRequestLoaded ) {
			setIsLoading( false );
			return undefined;
		}
		setIsLoading( true );
		const timer = setTimeout( () => {
			setFetchedData( fetchWindow( view ).data );
			setFetchedRequestKey( requestKey );
			setIsLoading( false );
		}, LOAD_DELAY_MS );
		return () => clearTimeout( timer );
	}, [ isRequestLoaded, requestKey, view ] );

	const shownData = isRequestLoaded ? fetchedData : [];
	const { paginationInfo } = useMemo( () => fetchWindow( view ), [ view ] );

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
				paginationInfo={ paginationInfo }
				data={ shownData }
				view={ view }
				fields={ fields }
				onChangeView={ setView }
				isLoading={ isLoading || ! isRequestLoaded }
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
