/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';
import { Card, CardHeader, CardBody } from '@wordpress/components';

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

const WithCardComponent = () => {
	const [ view, setView ] = useState< View >( {
		type: LAYOUT_TABLE,
		search: '',
		page: 1,
		perPage: 10,
		layout: {
			styles: {
				satellites: {
					align: 'end' as const,
				},
			},
		},
		filters: [],
		fields: [ 'categories' ],
		titleField: 'title',
		descriptionField: 'description',
		mediaField: 'image',
	} );
	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, fields );
	}, [ view ] );
	return (
		<Card>
			<CardHeader>Header</CardHeader>
			<CardBody>
				<DataViews
					getItemId={ ( item ) => item.id.toString() }
					paginationInfo={ paginationInfo }
					data={ shownData }
					view={ view }
					fields={ fields }
					onChangeView={ setView }
					actions={ actions.filter(
						( action ) => ! action.supportsBulk
					) }
					defaultLayouts={ {
						[ LAYOUT_TABLE ]: {},
						[ LAYOUT_GRID ]: {},
						[ LAYOUT_LIST ]: {},
						[ LAYOUT_ACTIVITY ]: {},
					} }
				/>
			</CardBody>
		</Card>
	);
};

export default WithCardComponent;
