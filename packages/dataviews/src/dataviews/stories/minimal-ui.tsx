/**
 * WordPress dependencies
 */
import { useState, useMemo, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataViews from '../index';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';
import type { Field, View } from '../../types';
import { DEFAULT_VIEW, data, fields, type SpaceObject } from './fixtures';

const MinimalUIComponent = ( {
	layout = 'table',
}: {
	layout: 'table' | 'list' | 'grid';
} ) => {
	const [ view, setView ] = useState< View >( {
		...DEFAULT_VIEW,
		fields: [ 'title', 'description', 'categories' ],
		layout: {
			enableMoving: false,
		},
	} );
	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, fields );
	}, [ view ] );

	const _fields: Field< SpaceObject >[] = fields.map( ( field ) => ( {
		...field,
		enableSorting: false,
		enableHiding: false,
		filterBy: false,
	} ) );

	useEffect( () => {
		setView( ( prevView ) => ( {
			...prevView,
			type: layout as any,
		} ) );
	}, [ layout ] );

	return (
		<DataViews
			getItemId={ ( item ) => item.id.toString() }
			paginationInfo={ paginationInfo }
			data={ shownData }
			view={ view }
			fields={ _fields }
			onChangeView={ setView }
			defaultLayouts={ { [ layout ]: {} } }
		>
			<DataViews.Layout />
			<DataViews.Footer />
		</DataViews>
	);
};

export default MinimalUIComponent;
