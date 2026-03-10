/**
 * WordPress dependencies
 */
import { useState, useMemo, useEffect } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import DataViews from '../index';
import { LAYOUT_TABLE } from '../../constants';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';
import type { View } from '../../types';
import { actions, data, fields, type SpaceObject } from './fixtures';

/**
 * Demonstrates the `scrollY: 'table'` layout option in a free composition
 * with route tabs and view actions in a shared toolbar, and the table
 * layout and footer below in a flex container.
 *
 * Compare with the default "Layout Table" story to see how the
 * scrolling behavior differs when the DataViews is composed with
 * custom markup around it.
 */
export const FreeCompositionScrollYComponent = ( {
	backgroundColor,
	hasClickableItems = true,
	groupBy = false,
	groupByLabel = true,
	perPageSizes = [ 10, 25, 50, 100 ],
	showMedia = true,
	scrollY = 'table' as 'wrapper' | 'table',
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
			className="free-composition-scroll-y"
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
				} }
				config={ { perPageSizes } }
			>
				<Stack
					className="free-composition-scroll-y__view-actions"
					direction="row"
					justify="space-between"
					align="center"
				>
					<Stack direction="row" align="center" gap="sm">
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							className="is-active"
						>
							All
						</Button>
						<Button __next40pxDefaultSize variant="tertiary">
							Published
						</Button>
						<Button __next40pxDefaultSize variant="tertiary">
							Drafts
						</Button>
						<Button __next40pxDefaultSize variant="tertiary">
							Trashed
						</Button>
					</Stack>
					<Stack direction="row" align="center" gap="sm">
						<DataViews.Search />
						<DataViews.FiltersToggle />
						<DataViews.ViewConfig />
					</Stack>
				</Stack>
				<DataViews.FiltersToggled className="free-composition-scroll-y__filters" />
				<div className="free-composition-scroll-y__layout-container">
					<DataViews.Layout />
					<DataViews.Footer />
				</div>
			</DataViews>
		</div>
	);
};

export default FreeCompositionScrollYComponent;
