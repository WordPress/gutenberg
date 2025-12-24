/**
 * WordPress dependencies
 */
import { useState, useMemo, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataViews from '../index';
import { LAYOUT_ACTIVITY } from '../../constants';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';
import type { View } from '../../types';
import {
	orderEventData,
	orderEventFields,
	orderEventActions,
} from './fixtures';

const LayoutActivityComponent = ( {
	showMedia = true,
	grouping = true,
	showLabel = true,
}: {
	showMedia: boolean;
	grouping: boolean;
	showLabel: boolean;
} ) => {
	const [ view, setView ] = useState< View >( {
		type: LAYOUT_ACTIVITY,
		search: '',
		page: 1,
		perPage: 20,
		filters: [],
		fields: [ 'time', 'categories', 'orderNumber' ],
		titleField: 'title',
		descriptionField: 'description',
		mediaField: 'icon',
		showMedia,
		sort: {
			field: 'datetime',
			direction: 'asc',
		},
		groupBy: grouping
			? {
					field: 'date',
					direction: 'asc',
					showLabel,
			  }
			: undefined,
	} );
	useEffect( () => {
		setView( ( prevView ) => {
			return {
				...prevView,
				groupBy: grouping
					? { field: 'date', direction: 'asc', showLabel }
					: undefined,
				showMedia,
			};
		} );
	}, [ showMedia, grouping, showLabel ] );

	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( orderEventData, view, orderEventFields );
	}, [ view ] );

	return (
		<DataViews
			getItemId={ ( item ) => item.id.toString() }
			paginationInfo={ paginationInfo }
			data={ shownData }
			view={ view }
			fields={ orderEventFields }
			onChangeView={ setView }
			actions={ orderEventActions }
			defaultLayouts={ {
				[ LAYOUT_ACTIVITY ]: {
					sort: {
						field: 'datetime',
						direction: 'asc',
					},
				},
			} }
		/>
	);
};

export default LayoutActivityComponent;
