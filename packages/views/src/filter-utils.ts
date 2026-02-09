/**
 * WordPress dependencies
 */
import type { View, Filter } from '@wordpress/dataviews';

type ActiveViewOverrides = {
	filters?: Filter[];
	sort?: View[ 'sort' ];
};

/**
 * Merges activeViewOverrides into a view.
 * Filters: Active filters take precedence; same-field filters are replaced.
 * Sort: Active sort is applied only if current sort matches the default.
 *
 * @param view                The view to merge overrides into.
 * @param activeViewOverrides The tab-specific overrides to apply.
 * @param defaultView         The default view configuration.
 * @return A new view with merged overrides, or the original view if no overrides.
 */
export function mergeActiveViewOverrides(
	view: View,
	activeViewOverrides?: ActiveViewOverrides,
	defaultView?: View
): View {
	if ( ! activeViewOverrides ) {
		return view;
	}

	let result = view;

	// Merge filters
	if (
		activeViewOverrides.filters &&
		activeViewOverrides.filters.length > 0
	) {
		const activeFields = new Set(
			activeViewOverrides.filters.map( ( f ) => f.field )
		);
		const preserved = ( view.filters ?? [] ).filter(
			( f: Filter ) => ! activeFields.has( f.field )
		);
		result = {
			...result,
			filters: [ ...preserved, ...activeViewOverrides.filters ],
		};
	}

	// Merge sort - only apply if the current sort matches the default
	if ( activeViewOverrides.sort ) {
		const isDefaultSort =
			defaultView &&
			view.sort?.field === defaultView.sort?.field &&
			view.sort?.direction === defaultView.sort?.direction;

		if ( isDefaultSort ) {
			result = {
				...result,
				sort: activeViewOverrides.sort,
			};
		}
	}

	return result;
}

/**
 * Strips overrides before persisting.
 * Filters: Removes filters on fields managed by activeViewOverrides.
 * Sort: If sort matches the override, restores the default sort.
 *
 * @param view                The view to strip overrides from.
 * @param activeViewOverrides The tab-specific override definitions.
 * @param defaultView         The default view configuration.
 * @return A new view with overrides stripped, or the original view if no overrides.
 */
export function stripActiveViewOverrides(
	view: View,
	activeViewOverrides?: ActiveViewOverrides,
	defaultView?: View
): View {
	if ( ! activeViewOverrides ) {
		return view;
	}

	let result = view;

	// Strip managed filters
	if (
		activeViewOverrides.filters &&
		activeViewOverrides.filters.length > 0
	) {
		const activeFields = new Set(
			activeViewOverrides.filters.map( ( f ) => f.field )
		);
		result = {
			...result,
			filters: ( view.filters ?? [] ).filter(
				( f: Filter ) => ! activeFields.has( f.field )
			),
		};
	}

	// Strip sort if it matches the override (restore to default)
	if (
		activeViewOverrides.sort &&
		view.sort?.field === activeViewOverrides.sort.field &&
		view.sort?.direction === activeViewOverrides.sort.direction
	) {
		result = {
			...result,
			sort: defaultView?.sort,
		};
	}

	return result;
}
