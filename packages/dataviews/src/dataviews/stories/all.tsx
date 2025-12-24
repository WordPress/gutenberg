/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';

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
import {
	DEFAULT_VIEW,
	actions,
	data,
	fields,
	type SpaceObject,
} from './fixtures';

export const DefaultComponent = ( {
	perPageSizes = [ 10, 25, 50, 100 ],
	hasClickableItems = true,
	backgroundColor,
}: {
	perPageSizes?: number[];
	hasClickableItems?: boolean;
	backgroundColor?: string;
} ) => {
	const [ view, setView ] = useState< View >( {
		...DEFAULT_VIEW,
		fields: [ 'categories' ],
		titleField: 'title',
		descriptionField: 'description',
		mediaField: 'image',
	} );
	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, fields );
	}, [ view ] );
	return (
		<div
			style={
				{
					'--wp-dataviews-color-background': backgroundColor,
				} as React.CSSProperties
			}
		>
			<DataViews
				getItemId={ ( item ) => item.id.toString() }
				paginationInfo={ paginationInfo }
				data={ shownData }
				view={ view }
				fields={ fields }
				onChangeView={ setView }
				actions={ actions }
				renderItemLink={ ( {
					item,
					...props
				}: {
					item: SpaceObject;
				} ) => (
					<button
						style={ {
							background: 'none',
							border: 'none',
							padding: 0,
						} }
						onClick={ () => {
							// eslint-disable-next-line no-alert
							alert( 'Clicked: ' + item.name.title );
						} }
						{ ...props }
					/>
				) }
				isItemClickable={ () => hasClickableItems }
				defaultLayouts={ {
					[ LAYOUT_TABLE ]: {},
					[ LAYOUT_GRID ]: {},
					[ LAYOUT_LIST ]: {},
					[ LAYOUT_ACTIVITY ]: {},
				} }
				config={ { perPageSizes } }
			/>
		</div>
	);
};

export default DefaultComponent;
