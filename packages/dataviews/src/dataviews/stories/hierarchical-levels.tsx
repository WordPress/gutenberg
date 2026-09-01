import { useState, useMemo, useEffect } from '@wordpress/element';
import DataViews from '../index';
import { LAYOUT_TABLE } from '../../constants';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';
import type { View } from '../../types';
import { hierarchicalData, hierarchicalFields } from './fixtures-hierarchy';

const HierarchicalLevelsComponent = ( {
	showLevels = true,
}: {
	showLevels?: boolean;
} ) => {
	const [ view, setView ] = useState< View >( {
		type: LAYOUT_TABLE,
		search: '',
		page: 1,
		perPage: 25,
		layout: {},
		filters: [],
		fields: [ 'type', 'parent' ],
		sort: {
			field: 'title',
			direction: 'asc',
		},
		titleField: 'title',
		mediaField: 'image',
		showLevels: true,
	} );

	useEffect( () => {
		setView( ( prevView ) => ( {
			...prevView,
			showLevels,
		} ) );
	}, [ showLevels ] );

	const { data, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate(
			hierarchicalData,
			view,
			hierarchicalFields
		);
	}, [ view ] );

	return (
		<DataViews
			getItemId={ ( item ) => item.id }
			getItemLevel={ ( item ) => item.level }
			data={ data }
			paginationInfo={ paginationInfo }
			view={ view }
			onChangeView={ setView }
			fields={ hierarchicalFields }
		/>
	);
};

export default HierarchicalLevelsComponent;
