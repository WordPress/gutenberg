import { useState, useEffect } from '@wordpress/element';
import DataViews from '../index';
import { LAYOUT_TABLE } from '../../constants';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';
import type { View } from '../../types';
import { data as allData, fields } from './fixtures';

const HierarchicalLevelsComponent = ( {
	showLevels = true,
	groupBy = false,
}: {
	showLevels?: boolean;
	groupBy?: boolean;
} ) => {
	const [ view, setView ] = useState< View >( {
		type: LAYOUT_TABLE,
		search: '',
		page: 1,
		perPage: 50,
		layout: {},
		filters: [],
		fields: [ 'type', 'parent' ],
		sort: {
			field: 'title',
			direction: 'asc',
		},
		titleField: 'title',
		mediaField: 'image',
		showLevels,
		groupBy: groupBy
			? {
					field: 'isPlanet',
					direction: 'asc',
				}
			: undefined,
	} );

	useEffect( () => {
		setView( ( prevView ) => ( {
			...prevView,
			showLevels,
			groupBy: groupBy
				? {
						field: 'isPlanet',
						direction: 'asc',
					}
				: undefined,
		} ) );
	}, [ groupBy, showLevels ] );

	const { data, paginationInfo } = filterSortAndPaginate(
		allData,
		view,
		fields
	);

	return (
		<DataViews
			getItemId={ ( item ) => item.id.toString() }
			getItemParentId={ ( item ) => item.parent }
			data={ data }
			paginationInfo={ paginationInfo }
			view={ view }
			onChangeView={ setView }
			fields={ fields }
			defaultLayouts={ { table: true } }
		/>
	);
};

export default HierarchicalLevelsComponent;
