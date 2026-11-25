import { useState, useMemo, useEffect } from '@wordpress/element';
import DataViews from '../index';
import { LAYOUT_GRID } from '../../constants';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';
import type { MediaFit, View } from '../../types';
import { actions, data, fields, type SpaceObject } from './fixtures';
import {
	getNarrowProp,
	narrowFrameClassName,
	type NarrowTabsField,
} from './narrow';

export const LayoutTableComponent = ( {
	backgroundColor,
	hasClickableItems = true,
	groupBy = false,
	groupByLabel = true,
	mediaFit = 'cover',
	mediaFitControl = true,
	narrow = false,
	narrowTabsField = 'type',
	perPageSizes = [ 10, 25, 50, 100 ],
	showMedia = true,
}: {
	backgroundColor?: string;
	hasClickableItems?: boolean;
	groupBy?: boolean;
	groupByLabel?: boolean;
	mediaFit?: MediaFit;
	mediaFitControl?: boolean;
	narrow?: boolean;
	narrowTabsField?: NarrowTabsField;
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
		layout: { mediaFit },
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
				// Spread the previous layout so a change made through the
				// view options popover survives an unrelated arg change.
				layout: { ...prevView.layout, mediaFit },
			} as View;
		} );
	}, [ groupBy, groupByLabel, mediaFit, showMedia ] );

	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, fields );
	}, [ view ] );
	return (
		<div
			className={ narrow ? narrowFrameClassName : undefined }
			style={ {
				height: narrow ? undefined : '100%',
				'--wp-dataviews-color-background': backgroundColor,
			} }
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
					[ LAYOUT_GRID ]: true,
				} }
				narrow={ getNarrowProp( narrow, narrowTabsField ) }
				config={ { perPageSizes, mediaFitControl } }
			/>
		</div>
	);
};

export default LayoutTableComponent;
