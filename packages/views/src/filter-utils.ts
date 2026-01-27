/**
 * WordPress dependencies
 */
import type { View, Filter } from '@wordpress/dataviews';

/**
 * Merges activeFilters into a view's filters array.
 * Active filters take precedence: any existing filter on the same
 * field is removed and replaced by the active filter.
 *
 * @param view          The view to merge filters into.
 * @param activeFilters The tab-specific filters to overlay.
 * @return A new view with merged filters, or the original view if no activeFilters.
 */
export function mergeActiveFilters(
	view: View,
	activeFilters?: Filter[]
): View {
	if ( ! activeFilters || activeFilters.length === 0 ) {
		return view;
	}
	const activeFields = new Set( activeFilters.map( ( f ) => f.field ) );
	const preserved = ( view.filters ?? [] ).filter(
		( f: Filter ) => ! activeFields.has( f.field )
	);
	return {
		...view,
		filters: [ ...preserved, ...activeFilters ],
	};
}

/**
 * Strips filters on fields managed by activeFilters.
 * Used before persisting to ensure tab-specific filters
 * are not stored in preferences.
 *
 * @param view          The view to strip filters from.
 * @param activeFilters The tab-specific filter definitions.
 * @return A new view with managed fields' filters removed, or the original view if no activeFilters.
 */
export function stripActiveFilterFields(
	view: View,
	activeFilters?: Filter[]
): View {
	if ( ! activeFilters || activeFilters.length === 0 ) {
		return view;
	}
	const activeFields = new Set( activeFilters.map( ( f ) => f.field ) );
	return {
		...view,
		filters: ( view.filters ?? [] ).filter(
			( f: Filter ) => ! activeFields.has( f.field )
		),
	};
}
