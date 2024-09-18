/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataViews from '../index';
import { DEFAULT_VIEW, actions, data, fields } from './fixtures';
import { LAYOUT_GRID, LAYOUT_TABLE } from '../../../constants';
import { filterSortAndPaginate } from '../../../filter-and-sort-data-view';

const meta = {
	title: 'DataViews/DataViews',
	component: DataViews,
};
export default meta;

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
		/>
	);
};
Default.args = {
	actions,
	defaultLayouts: {
		[ LAYOUT_TABLE ]: {
			layout: {
				primaryField: 'title',
				styles: {
					image: {
						width: 50,
					},
					title: {
						maxWidth: 400,
					},
					type: {
						maxWidth: 400,
					},
					description: {
						maxWidth: 200,
					},
				},
			},
		},
		[ LAYOUT_GRID ]: {
			layout: {
				mediaField: 'image',
				primaryField: 'title',
			},
		},
	},
};
