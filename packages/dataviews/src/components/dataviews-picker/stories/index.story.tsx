/**
 * External dependencies
 */
import type { Meta } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState, useMemo, useCallback, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataViewsPicker from '../index';
import {
	data,
	fields,
	type SpaceObject,
} from '../../dataviews/stories/fixtures';
import { LAYOUT_PICKER_GRID } from '../../../constants';
import { filterSortAndPaginate } from '../../../filter-and-sort-data-view';
import type { ActionButton, View } from '../../../types';

const meta = {
	title: 'DataViews/DataViewsPicker',
	component: DataViewsPicker,
} as Meta< typeof DataViewsPicker >;

export default meta;

export const Default = ( {
	perPageSizes = [ 10, 25, 50, 100 ],
	isMultiselectable,
	isGrouped,
	infiniteScrollEnabled,
}: {
	perPageSizes: number[];
	isMultiselectable: boolean;
	isGrouped: boolean;
	infiniteScrollEnabled: boolean;
} ) => {
	const [ view, setView ] = useState< View >( {
		type: LAYOUT_PICKER_GRID,
		fields: [],
		titleField: 'title',
		mediaField: 'image',
		search: '',
		page: 1,
		perPage: 10,
		filters: [],
		groupByField: isGrouped ? 'type' : undefined,
		infiniteScrollEnabled,
	} );
	const { data: shownData, paginationInfo: normalPaginationInfo } =
		useMemo( () => {
			return filterSortAndPaginate( data, view, fields );
		}, [ view ] );

	useEffect( () => {
		setView( ( prevView ) => ( {
			...prevView,
			groupByField:
				isGrouped && ! infiniteScrollEnabled ? 'type' : undefined,
			infiniteScrollEnabled,
		} ) );
	}, [ isGrouped, infiniteScrollEnabled ] );

	const [ selection, setSelection ] = useState< string[] >( [] );

	const actions: ActionButton< SpaceObject >[] = [
		{
			id: 'cancel',
			label: 'Cancel',
			supportsBulk: isMultiselectable,
			callback() {
				setSelection( [] );
			},
		},
		{
			id: 'confirm',
			label: 'Confirm',
			isPrimary: true,
			supportsBulk: isMultiselectable,
			callback() {
				const selectedItemNames = data
					.filter(
						( item ) => selection?.includes( String( item.id ) )
					)
					.map( ( item ) => item.title )
					.join( ', ' );
				// eslint-disable-next-line no-alert
				window.alert( selectedItemNames );
			},
		},
	];

	const {
		data: infiniteScrollData,
		paginationInfo: infiniteScrollPaginationInfo,
		isLoadingMore,
	} = useInfiniteScroll( {
		view,
		setView,
		data: shownData,
		getItemId: ( item ) => item.id.toString(),
	} );

	return (
		<>
			{ infiniteScrollEnabled && (
				<style>{ `
					.dataviews-wrapper {
						height: 600px;
						overflow: auto;
					}
				` }</style>
			) }
			<DataViewsPicker
				actions={ actions }
				selection={ selection }
				onChangeSelection={ ( selectedIds ) => {
					setSelection( selectedIds );
				} }
				getItemId={ ( item ) => item.id.toString() }
				paginationInfo={
					infiniteScrollEnabled
						? infiniteScrollPaginationInfo
						: normalPaginationInfo
				}
				data={ infiniteScrollEnabled ? infiniteScrollData : shownData }
				isLoading={ infiniteScrollEnabled ? isLoadingMore : undefined }
				view={ view }
				fields={ fields }
				onChangeView={ setView }
				config={ { perPageSizes } }
				itemListLabel="Galactic Bodies"
				defaultLayouts={ {
					[ LAYOUT_PICKER_GRID ]: {},
				} }
			/>
		</>
	);
};

Default.args = {
	perPageSizes: [ 10, 25, 50, 100 ],
	isMultiselectable: false,
	isGrouped: false,
};

Default.argTypes = {
	isMultiselectable: {
		control: 'boolean',
		description: 'Whether multiselection is supported',
	},
	perPageSizes: {
		control: 'object',
		description: 'Array of available page sizes',
	},
	isGrouped: {
		control: 'boolean',
		description: 'Whether the items are grouped or ungrouped',
	},
	infiniteScrollEnabled: {
		control: 'boolean',
		description:
			'Whether the infinite scroll is enabled. Enabling this disables the "Is grouped" option',
	},
};

function useInfiniteScroll( {
	view,
	setView,
	data: shownData,
	getItemId,
}: {
	view: View;
	setView: ( view: View ) => void;
	data: SpaceObject[];
	getItemId: ( item: SpaceObject ) => string;
} ): {
	data: SpaceObject[];
	paginationInfo: {
		totalItems: number;
		totalPages: number;
		infiniteScrollHandler?: ( () => void ) | undefined;
	};
	isLoadingMore: boolean;
	hasMoreData: boolean;
} {
	// Custom pagination handler that simulates server-side pagination
	const [ allLoadedRecords, setAllLoadedRecords ] = useState< SpaceObject[] >(
		[]
	);
	const [ isLoadingMore, setIsLoadingMore ] = useState( false );

	const totalItems = data.length;
	const totalPages = Math.ceil( totalItems / 6 ); // perPage is 6.
	const currentPage = view.page || 1;
	const hasMoreData = currentPage < totalPages;

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

	return {
		data: allLoadedRecords,
		paginationInfo,
		isLoadingMore,
		hasMoreData,
	};
}
