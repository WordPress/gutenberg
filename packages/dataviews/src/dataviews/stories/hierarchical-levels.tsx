import { useState, useEffect } from '@wordpress/element';
import DataViews from '../index';
import { LAYOUT_TABLE } from '../../constants';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';
import type { View } from '../../types';
import { data as allData, fields, type SpaceObject } from './fixtures';

/**
 * Simulates what the WordPress REST API does for `orderby_hierarchy` (see
 * Gutenberg_Hierarchical_Sort in lib/experimental): filter and sort the whole
 * list first, then order it depth-first so that each item sits right below
 * its parent, then paginate.
 *
 * Siblings keep the sort order. Items whose parent is not in the filtered
 * list come after all the root trees, grouped by parent, and keep their own
 * level so they stay indented as deep as they really are.
 */
function sortByHierarchy( items: SpaceObject[], view: View ) {
	const { data: sortedItems } = filterSortAndPaginate(
		items,
		{ ...view, page: undefined, perPage: undefined },
		fields
	);

	let orderedItems = sortedItems;
	if ( view.showLevels ) {
		// Children grouped by parent, in the order the parents first appear.
		const childrenByParent = new Map< number | null, SpaceObject[] >();
		sortedItems.forEach( ( item ) => {
			childrenByParent.set( item.parent, [
				...( childrenByParent.get( item.parent ) ?? [] ),
				item,
			] );
		} );

		orderedItems = [];
		const visit = ( parent: number | null ) => {
			( childrenByParent.get( parent ) ?? [] ).forEach( ( item ) => {
				orderedItems.push( item );
				visit( item.id );
			} );
			// Once visited, a group must not be emitted again as an orphan group.
			childrenByParent.delete( parent );
		};

		// Roots and their descendants first.
		visit( null );
		// Then the items whose parent is not in the list, grouped by parent.
		Array.from( childrenByParent.keys() ).forEach( visit );
	}

	const page = view.page ?? 1;
	const perPage = view.perPage ?? orderedItems.length;
	return {
		data: orderedItems.slice( ( page - 1 ) * perPage, page * perPage ),
		paginationInfo: {
			totalItems: orderedItems.length,
			totalPages: Math.ceil( orderedItems.length / perPage ),
		},
	};
}

const HierarchicalLevelsComponent = ( {
	showLevels = true,
}: {
	showLevels?: boolean;
} ) => {
	const [ view, setView ] = useState< View >( {
		type: LAYOUT_TABLE,
		search: '',
		page: 1,
		perPage: 50,
		layout: {},
		filters: [],
		fields: [ 'type', 'parent' ],
		sort: {
			field: 'title',
			direction: 'asc',
		},
		titleField: 'title',
		mediaField: 'image',
		showLevels: true,
	} );

	useEffect( () => {
		setView( ( prevView ) => ( {
			...prevView,
			showLevels,
		} ) );
	}, [ showLevels ] );

	const { data, paginationInfo } = sortByHierarchy( allData, view );

	return (
		<DataViews
			getItemId={ ( item ) => item.id.toString() }
			getItemLevel={ ( item ) => item.level }
			data={ data }
			paginationInfo={ paginationInfo }
			view={ view }
			onChangeView={ setView }
			fields={ fields }
			defaultLayouts={ { table: true } }
		/>
	);
};

export default HierarchicalLevelsComponent;
