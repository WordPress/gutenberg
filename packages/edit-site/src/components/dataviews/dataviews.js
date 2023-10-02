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
import GlobalSearchInput from './global-search-input';
import DataViewsContext from './context';

export default function DataViews( {
	data,
	fields,
	isLoading,
	paginationInfo,
	options,
} ) {
	const dataView = useReactTable( {
		data,
		columns: fields,
		...options,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	} );
	return (
		<DataViewsContext.Provider value={ { ...dataView } }>
			<div className="dataviews-wrapper">
				<VStack spacing={ 4 }>
					<HStack justify="space-between">
						<GlobalSearchInput />
						<ViewActions />
					</HStack>
					{ /* This component will be selected based on viewConfigs. Now we only have the list view. */ }
					<ListView isLoading={ isLoading } />
					<Pagination totalItems={ paginationInfo?.totalItems } />
				</VStack>
			</div>
		</DataViewsContext.Provider>
	);
}
