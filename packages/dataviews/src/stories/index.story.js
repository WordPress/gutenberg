/**
 * WordPress dependencies
 */
import { useState, useMemo, useCallback } from '@wordpress/element';

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

const defaultConfigPerViewType = {
	[ LAYOUT_TABLE ]: {
		primaryField: 'title',
	},
	[ LAYOUT_GRID ]: {
		mediaField: 'image',
		primaryField: 'title',
	},
};

export const Default = ( props ) => {
	const [ view, setView ] = useState( DEFAULT_VIEW );
	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, fields );
	}, [ view ] );
	const onChangeView = useCallback(
		( newView ) => {
			if ( newView.type !== view.type ) {
				newView = {
					...newView,
					layout: {
						...defaultConfigPerViewType[ newView.type ],
					},
				};
			}

			setView( newView );
		},
		[ view.type, setView ]
	);
	return (
		<DataViews
			{ ...props }
			paginationInfo={ paginationInfo }
			data={ shownData }
			view={ view }
			fields={ fields }
			onChangeView={ onChangeView }
		/>
	);
};
Default.args = {
	actions,
	supportedLayouts: [ LAYOUT_TABLE, LAYOUT_GRID ],
};
