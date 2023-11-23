/**
 * WordPress dependencies
 */
import {
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	Popover,
} from '@wordpress/components';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ViewList from './view-list';
import Pagination from './pagination';
import ViewActions from './view-actions';
import Filters from './filters';
import Search from './search';
import { ViewGrid } from './view-grid';
import { ViewSideBySide } from './view-side-by-side';
import BulkActions from './bulk-actions';

// To do: convert to view type registry.
export const viewTypeSupportsMap = {
	list: {},
	grid: {},
	'side-by-side': {
		preview: true,
	},
};

const viewTypeMap = {
	list: ViewList,
	grid: ViewGrid,
	'side-by-side': ViewSideBySide,
};

export default function DataViews( {
	view,
	onChangeView,
	fields,
	search = true,
	searchLabel = undefined,
	actions,
	data,
	getItemId,
	isLoading = false,
	paginationInfo,
	supportedLayouts,
	selection,
	setSelection,
	bulkActions,
} ) {
	const ViewComponent = viewTypeMap[ view.type ];
	const _fields = useMemo( () => {
		return fields.map( ( field ) => ( {
			...field,
			render: field.render || field.getValue,
		} ) );
	}, [ fields ] );
	return (
		<div className="dataviews-wrapper">
			<VStack spacing={ 4 } justify="flex-start">
				<HStack alignment="flex-start">
					<HStack justify="start" wrap>
						{ search && (
							<Search
								label={ searchLabel }
								view={ view }
								onChangeView={ onChangeView }
							/>
						) }
						<Filters
							fields={ fields }
							view={ view }
							onChangeView={ onChangeView }
						/>
					</HStack>
					<HStack justify="end" expanded={ false }>
						<ViewActions
							fields={ fields }
							view={ view }
							onChangeView={ onChangeView }
							supportedLayouts={ supportedLayouts }
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
					getItemId={ getItemId }
					isLoading={ isLoading }
					selection={ selection }
					setSelection={ setSelection }
				/>

				<div>
				<Pagination
					view={ view }
					onChangeView={ onChangeView }
					paginationInfo={ paginationInfo }
				/>
					<BulkActions
						data={ data }
						bulkActions={ bulkActions }
						selection={ selection }
						setSelection={ setSelection }
					/>
				</div>
			</VStack>
		</div>
	);
}
