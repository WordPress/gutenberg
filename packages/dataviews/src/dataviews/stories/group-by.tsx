/**
 * WordPress dependencies
 */
import { useState, useMemo, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataViews from '../index';
import {
	LAYOUT_GRID,
	LAYOUT_LIST,
	LAYOUT_TABLE,
	LAYOUT_ACTIVITY,
} from '../../constants';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';
import type { View } from '../../types';
import { actions, data, fields } from './fixtures';

const GroupByLayoutComponent = ( {
	showLabel = true,
}: {
	showLabel: boolean;
} ) => {
	const [ view, setView ] = useState< View >( {
		type: LAYOUT_GRID,
		search: '',
		page: 1,
		perPage: 20,
		filters: [],
		fields: [ 'satellites' ],
		titleField: 'title',
		descriptionField: 'description',
		mediaField: 'image',
		groupBy: { field: 'type', direction: 'asc', showLabel },
		layout: {
			badgeFields: [ 'satellites' ],
		},
	} );

	useEffect( () => {
		setView( ( prevView ) => ( {
			...prevView,
			groupBy: { field: 'type', direction: 'asc', showLabel },
		} ) );
	}, [ showLabel ] );

	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, fields );
	}, [ view ] );
	return (
		<DataViews
			getItemId={ ( item ) => item.id.toString() }
			paginationInfo={ paginationInfo }
			data={ shownData }
			view={ view }
			fields={ fields }
			onChangeView={ setView }
			actions={ actions }
			defaultLayouts={ {
				[ LAYOUT_TABLE ]: {},
				[ LAYOUT_GRID ]: {},
				[ LAYOUT_LIST ]: {},
				[ LAYOUT_ACTIVITY ]: {},
			} }
		/>
	);
};

export default GroupByLayoutComponent;
