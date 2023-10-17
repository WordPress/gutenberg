/**
 * WordPress dependencies
 */
import {
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ViewList from './view-list';
import Pagination from './pagination';
import ViewActions from './view-actions';
import TextFilter from './text-filter';
import InFilter from './in-filter';
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
				<HStack>
					<HStack justify="start">
						{ view.layout?.filters?.map( ( filter ) => {
							if ( filter.type === 'search' ) {
								return (
									<TextFilter
										key={ filter.id }
										id={ filter.id }
										view={ view }
										onChangeView={ onChangeView }
									/>
								);
							}
							if ( filter.type === 'in' ) {
								return (
									<InFilter
										key={ filter.id }
										id={ filter.id }
										fields={ fields }
										view={ view }
										onChangeView={ onChangeView }
									/>
								);
							}

							return null;
						} ) || __( 'No filters available' ) }
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
