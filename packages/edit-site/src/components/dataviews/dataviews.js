/**
 * WordPress dependencies
 */
import {
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ViewList from './view-list';
import Pagination from './pagination';
import ViewActions from './view-actions';
import Filters from './filters';
import TextFilter from './text-filter';
import { ViewGrid } from './view-grid';

const searchFilter = {
	id: 'search',
	type: 'search',
	name: __( 'Filter list' ),
};

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
	const _fields = useMemo( () => {
		return fields.map( ( field ) => ( {
			...field,
			render: field.render || field.getValue,
		} ) );
	}, [ fields ] );
	return (
		<div className="dataviews-wrapper">
			<VStack spacing={ 4 } justify="flex-start">
				<HStack>
					<HStack justify="start">
						<TextFilter
							filter={ searchFilter }
							view={ view }
							onChangeView={ onChangeView }
						/>
						<Filters
							fields={ fields }
							view={ view }
							onChangeView={ onChangeView }
						/>
					</HStack>
					<HStack justify="end">
						<ViewActions
							fields={ fields }
							view={ view }
							onChangeView={ onChangeView }
						/>
					</HStack>
				</HStack>
				<ViewComponent
					fields={ _fields }
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
