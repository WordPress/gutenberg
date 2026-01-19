/**
 * WordPress dependencies
 */
import { useState, useMemo, useCallback, useEffect } from '@wordpress/element';
import { __experimentalText as Text } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DataViews from '../index';
import {
	LAYOUT_ACTIVITY,
	LAYOUT_GRID,
	LAYOUT_LIST,
	LAYOUT_TABLE,
} from '../../constants';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';
import type { View } from '../../types';
import { actions, data, fields, type SpaceObject } from './fixtures';

const InfiniteScroll = () => {
	const [ view, setView ] = useState< View >( {
		type: LAYOUT_GRID,
		search: '',
		page: 1,
		perPage: 6, // Start with a small number to demonstrate pagination
		filters: [],
		fields: [ 'satellites' ],
		titleField: 'title',
		descriptionField: 'description',
		mediaField: 'image',
		infiniteScrollEnabled: true, // Enable infinite scroll by default
	} );
	const { data: shownData } = useMemo( () => {
		return filterSortAndPaginate( data, view, fields );
	}, [ view ] );

	// Custom pagination handler that simulates server-side pagination
	const [ allLoadedRecords, setAllLoadedRecords ] = useState< SpaceObject[] >(
		[]
	);
	const [ isLoadingMore, setIsLoadingMore ] = useState( false );

	const totalItems = data.length;
	const totalPages = Math.ceil( totalItems / 6 ); // perPage is 6.
	const currentPage = view.page || 1;
	const hasMoreData = currentPage < totalPages;
	const getItemId = ( item: {
		id: any;
		title?: string;
		description?: string;
		image?: string;
		type?: string;
		isPlanet?: boolean;
		categories?: string[];
		satellites?: number;
		date?: string;
		datetime?: string;
		email?: string;
	} ) => item.id.toString();

	const infiniteScrollHandler = useCallback( () => {
		if ( isLoadingMore || currentPage >= totalPages ) {
			return;
		}

		setIsLoadingMore( true );

		setView( {
			...view,
			page: currentPage + 1,
		} );
	}, [ isLoadingMore, currentPage, totalPages, view ] );

	// Initialize data on first load or when view changes significantly
	useEffect( () => {
		if ( currentPage === 1 || ! view.infiniteScrollEnabled ) {
			// First page - replace all data
			setAllLoadedRecords( shownData );
		} else {
			// Subsequent pages - append to existing data
			setAllLoadedRecords( ( prev ) => {
				const existingIds = new Set( prev.map( getItemId ) );
				const newRecords = shownData.filter(
					( record ) => ! existingIds.has( getItemId( record ) )
				);
				return [ ...prev, ...newRecords ];
			} );
		}
		setIsLoadingMore( false );
	}, [
		shownData,
		view.search,
		view.filters,
		view.perPage,
		currentPage,
		view.infiniteScrollEnabled,
	] );

	const paginationInfo = {
		totalItems,
		totalPages,
		infiniteScrollHandler,
	};

	return (
		<>
			<style>{ `
			.dataviews-wrapper {
				height: 600px;
				overflow: auto;
			}
		` }</style>
			<Text
				style={ {
					marginBottom: '16px',
					padding: '8px',
					background: '#f0f0f0',
					borderRadius: '4px',
					display: 'block',
				} }
			>
				{ __( 'Infinite Scroll Demo' ) }: { allLoadedRecords.length } of{ ' ' }
				{ totalItems } items loaded.
				{ isLoadingMore && __( 'Loading more…' ) }
				{ ! hasMoreData && __( 'All items loaded!' ) }
			</Text>
			<DataViews
				getItemId={ ( item ) => item.id.toString() }
				paginationInfo={ paginationInfo }
				data={ allLoadedRecords }
				view={ view }
				fields={ fields }
				onChangeView={ setView }
				actions={ actions }
				isLoading={ isLoadingMore }
				defaultLayouts={ {
					[ LAYOUT_TABLE ]: {},
					[ LAYOUT_GRID ]: {},
					[ LAYOUT_LIST ]: {},
					[ LAYOUT_ACTIVITY ]: {},
				} }
			/>
		</>
	);
};

export default InfiniteScroll;
