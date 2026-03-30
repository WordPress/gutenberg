/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';
// TODO: enable in the ESlint rule once we complete
// https://github.com/WordPress/gutenberg/issues/76135.
// eslint-disable-next-line @wordpress/use-recommended-components
import { Card } from '@wordpress/ui';

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

const WithCardComponent = ( {
	containerHeight,
}: {
	containerHeight: string;
} ) => {
	const [ view, setView ] = useState< View >( {
		type: LAYOUT_TABLE,
		search: '',
		page: 1,
		perPage: 10,
		layout: {},
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
		<Card.Root>
			<Card.Header>
				<Card.Title>Header</Card.Title>
			</Card.Header>
			<Card.Content style={ { height: containerHeight, minHeight: 0 } }>
				<Card.FullBleed>
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
				</Card.FullBleed>
			</Card.Content>
		</Card.Root>
	);
};

export default WithCardComponent;
