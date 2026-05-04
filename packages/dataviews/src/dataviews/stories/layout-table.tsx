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

type HierarchicalSpaceObject = SpaceObject & {
	level: number;
};

const getItemByTitle = ( title: string ) => {
	const item = data.find( ( dataItem ) => dataItem.name.title === title );
	if ( ! item ) {
		throw new Error( `Missing fixture item: ${ title }` );
	}
	return item;
};

const createHierarchyItem = (
	title: string,
	level: number,
	overrides: Partial< SpaceObject > = {}
): HierarchicalSpaceObject => ( {
	...getItemByTitle( title ),
	...overrides,
	level,
} );

const hierarchicalData: HierarchicalSpaceObject[] = [
	createHierarchyItem( 'Jupiter', 0, {
		satellites: 95,
		type: 'Planet group',
	} ),
	createHierarchyItem( 'Io', 1 ),
	createHierarchyItem( 'Europa', 1, {
		name: {
			...getItemByTitle( 'Europa' ).name,
			title: 'Europa variations',
		},
	} ),
	createHierarchyItem( 'Ganymede', 2 ),
	createHierarchyItem( 'Callisto', 2 ),
	createHierarchyItem( 'Neptune', 0 ),
	createHierarchyItem( 'Triton', 1 ),
	createHierarchyItem( 'Nereid', 1 ),
	createHierarchyItem( 'Earth', 0 ),
	createHierarchyItem( 'Moon', 1 ),
];

export const LayoutTableComponent = ( {
	backgroundColor,
	hasClickableItems = true,
	groupBy = false,
	groupByLabel = true,
	hierarchyStyle,
	showHierarchyBadge = true,
	expandChildren = false,
	perPageSizes = [ 10, 25, 50, 100 ],
	showMedia = true,
}: {
	backgroundColor?: string;
	hasClickableItems?: boolean;
	groupBy?: boolean;
	groupByLabel?: boolean;
	hierarchyStyle?: 'text' | 'tree';
	showHierarchyBadge?: boolean;
	expandChildren?: boolean;
	perPageSizes?: number[];
	showMedia?: boolean;
} ) => {
	const [ view, setView ] = useState< View >( {
		type: LAYOUT_TABLE,
		search: '',
		page: 1,
		perPage: 10,
		layout: hierarchyStyle
			? {
					hierarchyStyle,
					showHierarchyBadge,
					expandChildren,
			  }
			: {},
		filters: [],
		fields: hierarchyStyle ? [ 'type', 'satellites' ] : [ 'categories' ],
		titleField: 'title',
		descriptionField: 'description',
		mediaField: 'image',
		showMedia,
		showLevels: !! hierarchyStyle,
	} );

	useEffect( () => {
		setView( ( prevView ) => {
			return {
				...prevView,
				fields: hierarchyStyle
					? [ 'type', 'satellites' ]
					: [ 'categories' ],
				groupBy: groupBy
					? {
							field: 'type',
							direction: 'asc',
							showLabel: groupByLabel,
					  }
					: undefined,
				layout: {
					...prevView.layout,
					...( hierarchyStyle
						? {
								hierarchyStyle,
								showHierarchyBadge,
								expandChildren,
								density: prevView.layout?.density || 'balanced',
						  }
						: {
								hierarchyStyle: 'text',
								density: prevView.layout?.density || 'balanced',
						  } ),
				},
				showMedia,
				showLevels: !! hierarchyStyle,
			};
		} );
	}, [
		expandChildren,
		groupBy,
		groupByLabel,
		hierarchyStyle,
		showHierarchyBadge,
		showMedia,
	] );

	const dataToUse = hierarchyStyle ? hierarchicalData : data;

	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( dataToUse, view, fields );
	}, [ dataToUse, view ] );
	return (
		<div
			style={ {
				height: '100%',
				'--wp-dataviews-color-background': backgroundColor,
			} }
		>
			<DataViews
				getItemId={ ( item ) => item.id.toString() }
				getItemLevel={
					hierarchyStyle
						? ( item ) => ( item as HierarchicalSpaceObject ).level
						: undefined
				}
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
					[ LAYOUT_TABLE ]: true,
				} }
				config={ { perPageSizes } }
			/>
		</div>
	);
};

export default LayoutTableComponent;
