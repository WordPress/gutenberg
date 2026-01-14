/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataViews from '../index';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';
import type { View } from '../../types';
import { data, fields } from './fixtures';
import { LAYOUT_TABLE } from '../../constants';

/**
 * Custom layout component that renders a simple list of titles.
 */
function CustomList( { items }: { items: typeof data } ) {
	return (
		<ul style={ { listStyle: 'none', padding: 0, margin: 0 } }>
			{ items.map( ( item ) => (
				<li
					key={ item.id }
					style={ {
						padding: '8px 0',
						borderBottom: '1px solid #ddd',
					} }
				>
					{ item.name.title }
				</li>
			) ) }
		</ul>
	);
}

/**
 * Demonstrates a custom layout using free composition.
 *
 * This story shows how to:
 * - Use `<DataViews>` as a context provider with custom children
 * - Render your own layout instead of using `<DataViews.Layout />`
 * - Still leverage DataViews sub-components for search and pagination
 */
export const LayoutCustomComponent = () => {
	const [ view, setView ] = useState< View >( {
		type: LAYOUT_TABLE,
		search: '',
		page: 1,
		perPage: 10,
		filters: [],
		fields: [],
	} );

	const { data: processedData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, fields );
	}, [ view ] );

	return (
		<DataViews
			getItemId={ ( item ) => item.id.toString() }
			paginationInfo={ paginationInfo }
			data={ processedData }
			view={ view }
			fields={ fields }
			onChangeView={ setView }
			defaultLayouts={ { table: {} } }
		>
			<DataViews.Search />
			<CustomList items={ processedData } />
			<DataViews.Pagination />
		</DataViews>
	);
};

export default LayoutCustomComponent;
