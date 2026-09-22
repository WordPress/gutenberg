import { useState, useEffect } from '@wordpress/element';
import DataViews from '../index';
import { LAYOUT_TABLE } from '../../constants';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';
import type { View } from '../../types';
import { data as allData, fields } from './fixtures';

const HierarchicalLevelsComponent = ( {
	showLevels = true,
}: {
	showLevels?: boolean;
} ) => {
	const [ expandedItemIds, setExpandedItemIds ] = useState< string[] >( [
		'38',
	] );
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
	} );

	useEffect( () => {
		setView( ( prevView ) => ( {
			...prevView,
			showLevels,
		} ) );
	}, [ showLevels ] );

	const { data, paginationInfo } = filterSortAndPaginate(
		allData,
		view,
		fields
	);
	const parentIds = new Set(
		allData
			.map( ( item ) => item.parent )
			.filter( ( parent ) => parent !== null )
	);

	return (
		<DataViews
			getItemId={ ( item ) => item.id.toString() }
			getItemParentId={ ( item ) => item.parent }
			getItemHasChildren={ ( item ) => parentIds.has( item.id ) }
			expandedItemIds={ expandedItemIds }
			onChangeExpandedItemIds={ setExpandedItemIds }
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
