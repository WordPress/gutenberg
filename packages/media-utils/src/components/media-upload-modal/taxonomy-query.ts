import type { Filter } from '@wordpress/dataviews';

/**
 * The parts of a taxonomy record from core-data that the query needs.
 */
type QueryTaxonomy = {
	slug: string;
	rest_base?: string;
};

/**
 * Returns the REST query arguments for a view's filters on taxonomy fields.
 *
 * A taxonomy field is one whose ID is the taxonomy's REST base: the property
 * that holds an item's term IDs in its REST record, and the query parameter
 * that filters items by them. Filters on other fields are left for the caller.
 *
 * - `is` and `isAny` match items with any of the terms.
 * - `isAll` matches items with every one of the terms.
 * - `isNot` and `isNone` match items with none of the terms.
 *
 * A filter matches the chosen terms only, not their child terms, because the
 * REST API's `include_children` defaults to false. A filter with no terms
 * leaves the query alone.
 *
 * The post list route has a copy of this function, so change both together.
 *
 * @param filters    The view's filters.
 * @param taxonomies The taxonomies of the entity, as `getTaxonomies()` returns them.
 *
 * @return The query arguments, such as `{ categories: [ 3, 4 ] }`.
 */
export function getTaxonomyQueryArgs(
	filters: Filter[] = [],
	taxonomies: QueryTaxonomy[] = []
): Record< string, unknown > {
	const bases = new Set(
		taxonomies.map( ( taxonomy ) => taxonomy.rest_base || taxonomy.slug )
	);
	const args: Record< string, unknown > = {};

	for ( const filter of filters ) {
		if ( ! bases.has( filter.field ) ) {
			continue;
		}

		const terms = (
			Array.isArray( filter.value ) ? filter.value : [ filter.value ]
		).filter(
			( term ) => term !== undefined && term !== null && term !== ''
		);

		if ( ! terms.length ) {
			continue;
		}

		switch ( filter.operator ) {
			case 'is':
			case 'isAny':
				args[ filter.field ] = terms;
				break;
			case 'isAll':
				args[ filter.field ] = { terms, operator: 'AND' };
				break;
			case 'isNot':
			case 'isNone':
				args[ `${ filter.field }_exclude` ] = terms;
				break;
		}
	}

	return args;
}
