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
	const authors = [
		{ label: __( 'All authors' ), value: '' },
		...( fields
			.find( ( f ) => f.id === 'author' )
			.elements?.map( ( author ) => ( {
				label: author.name,
				value: author.id,
			} ) ) || [] ),
	];
	return (
		<div className="dataviews-wrapper">
			<VStack spacing={ 4 }>
				<HStack>
					<HStack justify="start">
						<TextFilter
							id={ 'search' }
							view={ view }
							onChangeView={ onChangeView }
						/>
						<InFilter
							id={ 'author' }
							options={ authors }
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
