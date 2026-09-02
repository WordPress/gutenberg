import { useState, useMemo, useEffect } from '@wordpress/element';
import DataViews from '../index';
import { LAYOUT_TABLE } from '../../constants';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';
import type { View } from '../../types';
import { data as allData, fields, type SpaceObject } from './fixtures';

/**
 * Orders a flat list depth-first so that each item sits right below its
 * parent. Siblings keep the relative order they had in the input, so the
 * list should already be sorted the way the consumer wants siblings sorted.
 * Items whose parent is not in the list (filtered out, for example) are
 * treated as roots.
 *
 * This is what the WordPress REST API does for `orderby_hierarchy`.
 */
function sortByHierarchy( items: SpaceObject[] ): SpaceObject[] {
	const ids = new Set( items.map( ( item ) => item.id ) );
	const childrenByParent = new Map< number | null, SpaceObject[] >();
	items.forEach( ( item ) => {
		const parent =
			item.parent !== null && ids.has( item.parent ) ? item.parent : null;
		childrenByParent.set( parent, [
			...( childrenByParent.get( parent ) ?? [] ),
			item,
		] );
	} );

	const result: SpaceObject[] = [];
	const visit = ( parent: number | null ) => {
		( childrenByParent.get( parent ) ?? [] ).forEach( ( item ) => {
			result.push( item );
			visit( item.id );
		} );
	};
	visit( null );
	return result;
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

	const { data, paginationInfo } = useMemo( () => {
		// Filter and sort first, then order by hierarchy, then paginate.
		// The sort decides the order of siblings; the hierarchy places each
		// item below its parent.
		const { data: sortedData } = filterSortAndPaginate(
			allData,
			{ ...view, page: undefined, perPage: undefined },
			fields
		);
		const orderedData = view.showLevels
			? sortByHierarchy( sortedData )
			: sortedData;
		const page = view.page ?? 1;
		const perPage = view.perPage ?? orderedData.length;
		return {
			data: orderedData.slice( ( page - 1 ) * perPage, page * perPage ),
			paginationInfo: {
				totalItems: orderedData.length,
				totalPages: Math.ceil( orderedData.length / perPage ),
			},
		};
	}, [ view ] );

	return (
		<DataViews
			getItemId={ ( item ) => item.id.toString() }
			getItemLevel={ ( item ) => item.level }
			data={ data }
			paginationInfo={ paginationInfo }
			view={ view }
			onChangeView={ setView }
			fields={ fields }
		/>
	);
};

export default HierarchicalLevelsComponent;
