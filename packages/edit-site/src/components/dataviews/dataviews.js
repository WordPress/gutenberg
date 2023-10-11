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
import ViewList from './view-list';
import Pagination from './pagination';
import ViewActions from './view-actions';
import TextFilter from './text-filter';
import { ViewGrid } from './view-grid';
import AddFilter from './add-filter';
import { moreVertical } from '@wordpress/icons';

export default function DataViews( {
	view,
	onChangeView,
	fields,
	actions,
	data,
	isLoading = false,
	paginationInfo,
} ) {
	const ViewComponent = view.type === 'list' ? ViewList : ViewGrid;
	return (
		<div className="dataviews-wrapper">
			<VStack spacing={ 4 }>
				<HStack justify="space-between">
					<TextFilter view={view} onChange={ dataView.setGlobalFilter } />
					{ Object.keys( view.filters ).map( ( key ) => {
						const field = dataView
							.getAllColumns()
							.find(
								( column ) =>
									column.columnDef.renderFilter &&
									column.id === key
							);
						if ( ! field ) {
							return null;
						}

						return field.columnDef.renderFilter();
					} ) }
					<AddFilter
						dataView={ dataView }
						filters={ view.filters }
						onChangeFilters={ onChangeView }
					/>
					<ViewActions
						fields={ fields }
						view={ view }
						onChangeView={ onChangeView }
					/>
				</HStack>
				<ViewComponent
					fields={ fields }
					view={ view }
					onChangeView={ onChangeView }
					paginationInfo={ paginationInfo }
					actions={ actions }
					data={ data }
					isLoading={ isLoading }
				/>
				<Pagination
					view={ view }
					onChangeView={ onChangeView }
					paginationInfo={ paginationInfo }
				/>
			</VStack>
		</div>
	);
}
