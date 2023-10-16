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
					<TextFilter view={ view } onChangeView={ onChangeView } />
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
