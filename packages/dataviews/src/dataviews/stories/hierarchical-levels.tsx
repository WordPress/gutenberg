import { useState, useMemo, useEffect } from '@wordpress/element';
import DataViews from '../index';
import { LAYOUT_TABLE } from '../../constants';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';
import type { View } from '../../types';
import {
	hierarchicalData,
	hierarchicalFields,
	type CelestialBody,
} from './fixtures-hierarchy';

type CelestialBodyWithLevel = CelestialBody & { level: number };

/**
 * Orders the items depth-first, each parent followed by its children, and
 * records how deep each one sits. DataViews does not reorder the data it
 * receives, so this is the consumer's job: it is what the REST API does for
 * the site editor's pages list when the view asks for `orderby_hierarchy`.
 */
function sortByHierarchy( items: CelestialBody[] ): CelestialBodyWithLevel[] {
	const childrenOf = new Map< string | null, CelestialBody[] >();
	for ( const item of items ) {
		const siblings = childrenOf.get( item.parent ) ?? [];
		siblings.push( item );
		childrenOf.set( item.parent, siblings );
	}

	const ordered: CelestialBodyWithLevel[] = [];
	const visit = ( parent: string | null, level: number ) => {
		for ( const item of childrenOf.get( parent ) ?? [] ) {
			ordered.push( { ...item, level } );
			visit( item.id, level + 1 );
		}
	};
	visit( null, 0 );

	return ordered;
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
		perPage: 25,
		layout: {},
		filters: [],
		fields: [ 'type', 'parent' ],
		titleField: 'title',
		mediaField: 'image',
		showLevels,
	} );

	// A sorted list is no longer in hierarchical order, so turning the levels
	// on also drops the sort. The reverse happens inside DataViews: sorting by
	// a field, from the column header or the view options, clears `showLevels`.
	useEffect( () => {
		setView( ( prevView ) => ( {
			...prevView,
			showLevels,
			sort: showLevels ? undefined : prevView.sort,
		} ) );
	}, [ showLevels ] );

	const orderedData = useMemo(
		() => sortByHierarchy( hierarchicalData ),
		[]
	);
	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( orderedData, view, hierarchicalFields );
	}, [ orderedData, view ] );

	return (
		<DataViews
			getItemId={ ( item ) => item.id }
			getItemLevel={ ( item ) => item.level }
			data={ shownData }
			paginationInfo={ paginationInfo }
			view={ view }
			onChangeView={ setView }
			fields={ hierarchicalFields }
			defaultLayouts={ {
				[ LAYOUT_TABLE ]: true,
			} }
			config={ { perPageSizes: [ 10, 25, 50 ] } }
		/>
	);
};

export default HierarchicalLevelsComponent;
