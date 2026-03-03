/**
 * WordPress dependencies
 */
import { useState, useMemo, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataViews from '../index';
import { LAYOUT_TABLE } from '../../constants';
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
	scrollY = 'wrapper',
}: {
	backgroundColor?: string;
	hasClickableItems?: boolean;
	groupBy?: boolean;
	groupByLabel?: boolean;
	perPageSizes?: number[];
	showMedia?: boolean;
	scrollY?: 'wrapper' | 'table';
} ) => {
	const [ view, setView ] = useState< View >( {
		type: LAYOUT_TABLE,
		search: '',
		page: 1,
		perPage: 10,
		layout: {
			scrollY,
		},
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
				layout: {
					...prevView.layout,
					scrollY,
				},
				groupBy: groupBy
					? {
							field: 'type',
							direction: 'asc',
							showLabel: groupByLabel,
					  }
					: undefined,
				showMedia,
			} as View;
		} );
	}, [ groupBy, groupByLabel, showMedia, scrollY ] );

	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, fields );
	}, [ view ] );
	return (
		<div
			style={
				{
					'--wp-dataviews-color-background': backgroundColor,
					height: scrollY === 'table' ? '400px' : undefined,
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
				} }
				config={ { perPageSizes } }
			/>
		</div>
	);
};

export default LayoutTableComponent;
