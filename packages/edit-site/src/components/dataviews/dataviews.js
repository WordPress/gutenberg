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
			sorting: [
				{ id: view.sort.column, desc: view.sort.direction === 'desc' },
			],
			globalFilter: view.search,
			pagination: {
				pageIndex: view.page,
				pageSize: view.perPage,
			},
		},
		onSortingChange: ( sortingUpdater ) => {
			onChangeView( ( currentView ) => {
				const [ { id, desc } ] =
					typeof sortingUpdater === 'function'
						? sortingUpdater( [
								{
									id: currentView.sort.column,
									desc: currentView.sort.direction === 'desc',
								},
						  ] )
						: sortingUpdater;
				return {
					...currentView,
					sort: { column: id, direction: desc ? 'desc' : 'asc' },
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
		meta: { resetQuery: () => onChangeView( { ...view } ) },
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
