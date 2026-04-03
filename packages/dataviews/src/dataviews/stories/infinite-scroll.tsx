/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataViews from '../index';
import {
	LAYOUT_ACTIVITY,
	LAYOUT_GRID,
	LAYOUT_LIST,
	LAYOUT_TABLE,
} from '../../constants';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';
import type { View } from '../../types';
import { actions, data, fields } from './fixtures';

const InfiniteScroll = () => {
	const [ view, setView ] = useState< View >( {
		type: LAYOUT_GRID,
		search: '',
		startPosition: 1,
		perPage: 15, // Start with a small number to demonstrate pagination
		filters: [],
		fields: [ 'satellites' ],
		titleField: 'title',
		descriptionField: 'description',
		mediaField: 'image',
		infiniteScrollEnabled: true, // Enable infinite scroll by default
	} );
	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, fields );
	}, [ view ] );
	return (
		<>
			<style>{ `
			.dataviews-wrapper {
				height: 750px;
				overflow: auto;
			}
		` }</style>
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
		</>
	);
};

export default InfiniteScroll;
