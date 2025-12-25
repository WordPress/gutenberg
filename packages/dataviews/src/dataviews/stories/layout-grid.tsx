/**
 * WordPress dependencies
 */
import { useState, useMemo, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataViews from '../index';
import { LAYOUT_GRID } from '../../constants';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';
import type { View } from '../../types';
import { actions, data, fields, type SpaceObject } from './fixtures';

export const LayoutTableComponent = ( {
	backgroundColor,
	hasClickableItems = true,
	groupBy = false,
	groupByLabel = true,
	perPageSizes = [ 10, 25, 50, 100 ],
	showMedia = true,
}: {
	backgroundColor?: string;
	hasClickableItems?: boolean;
	groupBy?: boolean;
	groupByLabel?: boolean;
	perPageSizes?: number[];
	showMedia?: boolean;
} ) => {
	const [ view, setView ] = useState< View >( {
		type: LAYOUT_GRID,
		search: '',
		page: 1,
		perPage: 10,
		filters: [],
		fields: [ 'categories' ],
		titleField: 'title',
		descriptionField: 'description',
		mediaField: 'image',
		showMedia,
	} );

	useEffect( () => {
		setView( ( prevView ) => {
			return {
				...prevView,
				groupBy: groupBy
					? {
							field: 'type',
							direction: 'asc',
							showLabel: groupByLabel,
					  }
					: undefined,
				showMedia,
			};
		} );
	}, [ groupBy, groupByLabel, showMedia ] );

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
					[ LAYOUT_GRID ]: {},
				} }
				config={ { perPageSizes } }
			/>
		</div>
	);
};

export default LayoutTableComponent;
