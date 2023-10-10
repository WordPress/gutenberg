/**
 * External dependencies
 */
import {
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	getPaginationRowModel,
	useReactTable,
} from '@tanstack/react-table';

/**
 * WordPress dependencies
 */
import {
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import ListView from './list-view';
import { Pagination } from './pagination';
import ViewActions from './view-actions';
import TextFilter from './text-filter';

export default function DataViews( {
	data,
	fields,
	view,
	onChangeView,
	isLoading,
	paginationInfo,
	options: { pageCount },
} ) {
	const dataView = useReactTable( {
		data,
		columns: fields,
		manualSorting: true,
		manualFiltering: true,
		manualPagination: true,
		enableRowSelection: true,
		state: {
			sorting: view.sort
				? [
						{
							id: view.sort.field,
							desc: view.sort.direction === 'desc',
						},
				  ]
				: [],
			globalFilter: view.search,
			pagination: {
				pageIndex: view.page,
				pageSize: view.perPage,
			},
		},
		onSortingChange: ( sortingUpdater ) => {
			onChangeView( ( currentView ) => {
				const sort =
					typeof sortingUpdater === 'function'
						? sortingUpdater(
								currentView.sort
									? [
											{
												id: currentView.sort.field,
												desc:
													currentView.sort
														.direction === 'desc',
											},
									  ]
									: []
						  )
						: sortingUpdater;
				if ( ! sort.length ) {
					return {
						...currentView,
						sort: {},
					};
				}
				const [ { id, desc } ] = sort;
				return {
					...currentView,
					sort: { field: id, direction: desc ? 'desc' : 'asc' },
				};
			} );
		},
		onGlobalFilterChange: ( value ) => {
			onChangeView( { ...view, search: value, page: 0 } );
		},
		onPaginationChange: ( paginationUpdater ) => {
			onChangeView( ( currentView ) => {
				const { pageIndex, pageSize } = paginationUpdater( {
					pageIndex: currentView.page,
					pageSize: currentView.perPage,
				} );
				return { ...view, page: pageIndex, perPage: pageSize };
			} );
		},
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		pageCount,
	} );
	return (
		<div className="dataviews-wrapper">
			<VStack spacing={ 4 }>
				<HStack justify="space-between">
					<TextFilter onChange={ dataView.setGlobalFilter } />
					<ViewActions dataView={ dataView } />
				</HStack>
				{ /* This component will be selected based on viewConfigs. Now we only have the list view. */ }
				<ListView dataView={ dataView } isLoading={ isLoading } />
				<Pagination
					dataView={ dataView }
					totalItems={ paginationInfo?.totalItems }
				/>
			</VStack>
		</div>
	);
}
