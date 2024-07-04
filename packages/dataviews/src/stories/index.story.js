/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { DataViews } from '../index';
import { DEFAULT_VIEW, actions, data, fields } from './fixtures';
import { LAYOUT_GRID, LAYOUT_TABLE } from '../constants';
import { filterSortAndPaginate } from '../filter-and-sort-data-view';

const meta = {
	title: 'DataViews/DataViews',
	component: DataViews,
};
export default meta;

const defaultFields = {
	[ LAYOUT_TABLE ]: [
		{ render: 'primary', field: 'title' },
		'description',
		'categories',
	],
	[ LAYOUT_GRID ]: [
		{ render: 'media', field: 'image' },
		{ render: 'primary', field: 'title' },
		'description',
		'categories',
	],
};

export const Default = ( props ) => {
	const [ view, setView ] = useState( DEFAULT_VIEW );
	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, fields );
	}, [ view ] );
	return (
		<DataViews
			{ ...props }
			paginationInfo={ paginationInfo }
			data={ shownData }
			view={ view }
			fields={ fields }
			onChangeView={ setView }
			defaultFields={ defaultFields }
		/>
	);
};
Default.args = {
	actions,
	supportedLayouts: [ LAYOUT_TABLE, LAYOUT_GRID ],
};
