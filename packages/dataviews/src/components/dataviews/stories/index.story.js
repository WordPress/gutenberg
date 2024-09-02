/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataViews from '../index';
import {
	DEFAULT_VIEW,
	actions,
	data,
	fields,
	themeData,
	themeFields,
} from './fixtures';
import { LAYOUT_GRID, LAYOUT_LIST, LAYOUT_TABLE } from '../../../constants';
import { filterSortAndPaginate } from '../../../filter-and-sort-data-view';

const meta = {
	title: 'DataViews/DataViews',
	component: DataViews,
};
export default meta;

export const Default = ( props ) => {
	const [ view, setView ] = useState( {
		...DEFAULT_VIEW,
		fields: [ 'title', 'description', 'categories' ],
	} );
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

export const Empty = ( props ) => {
	const [ view, setView ] = useState( {
		...DEFAULT_VIEW,
		fields: [ 'title', 'description', 'categories' ],
	} );

	return (
		<DataViews
			{ ...props }
			paginationInfo={ { totalItems: 0, totalPages: 0 } }
			data={ [] }
			view={ view }
			fields={ fields }
			onChangeView={ setView }
		/>
	);
};

export const FieldsNoSortableNoHidable = ( props ) => {
	const [ view, setView ] = useState( {
		...DEFAULT_VIEW,
		fields: [ 'title', 'description', 'categories' ],
	} );
	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, fields );
	}, [ view ] );

	const _fields = fields.map( ( field ) => ( {
		...field,
		enableSorting: false,
		enableHiding: false,
	} ) );

	return (
		<DataViews
			{ ...props }
			paginationInfo={ paginationInfo }
			data={ shownData }
			view={ view }
			fields={ _fields }
			onChangeView={ setView }
		/>
	);
};

export const CombinedFields = ( props ) => {
	const [ view, setView ] = useState( {
		...DEFAULT_VIEW,
		fields: [ 'theme', 'requires', 'tested' ],
	} );
	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( themeData, view, themeFields );
	}, [ view ] );

	const defaultLayouts = {
		table: {
			layout: {
				combinedFields: [
					{
						id: 'theme',
						header: 'Theme',
						children: [ 'name', 'description' ],
						direction: 'vertical',
					},
				],
			},
		},
	};

	return (
		<DataViews
			{ ...props }
			paginationInfo={ paginationInfo }
			data={ shownData }
			view={ view }
			fields={ themeFields }
			onChangeView={ setView }
			defaultLayouts={ defaultLayouts }
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
		[ LAYOUT_LIST ]: {
			layout: {
				mediaField: 'image',
				primaryField: 'title',
			},
		},
	},
};
