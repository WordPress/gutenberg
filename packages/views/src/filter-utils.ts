/**
 * External dependencies
 */
import { dequal } from 'dequal';

/**
 * WordPress dependencies
 */
import type { View, Filter } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import type { ActiveViewOverrides } from './types';

const SCALAR_VALUES = [
	'titleField',
	'mediaField',
	'descriptionField',
	'showTitle',
	'showMedia',
	'showDescription',
	'showLevels',
	'infiniteScrollEnabled',
] as const;

// Values that act as developer-provided defaults: the override applies only
// while the view still matches the default view, so an explicit user
// modification wins over the override (and gets persisted).
const DEFAULT_BOUND_VALUES = [ 'type', 'perPage', 'fields' ] as const;

/**
 * Merges activeViewOverrides into a view.
 * Filters: Active filters take precedence; same-field filters are replaced.
 * Sort, type, perPage, fields: Applied only if the current value matches the
 * default, so user modifications win.
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

	// Merge scalar overrides — always win over persisted values
	for ( const key of SCALAR_VALUES ) {
		if ( key in activeViewOverrides ) {
			result = { ...result, [ key ]: activeViewOverrides[ key ] };
		}
	}

	// Merge default-bound overrides — applied only while the view still
	// matches the default, so explicit user modifications win.
	for ( const key of DEFAULT_BOUND_VALUES ) {
		if (
			key in activeViewOverrides &&
			defaultView &&
			dequal( view[ key ], defaultView[ key ] )
		) {
			result = {
				...result,
				[ key ]: activeViewOverrides[ key ],
			} as View;
		}
	}

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

	// Merge layout — shallow merge, override keys always win
	if ( activeViewOverrides.layout ) {
		result = {
			...result,
			layout: {
				...( result as any ).layout,
				...activeViewOverrides.layout,
			},
		} as View;
	}

	// Merge groupBy — full replacement, override always wins
	if ( activeViewOverrides.groupBy ) {
		result = {
			...result,
			groupBy: activeViewOverrides.groupBy,
		};
	}

	return result;
}

/**
 * Strips overrides before persisting.
 * Filters: Removes filters on fields managed by activeViewOverrides.
 * Sort, type, perPage, fields: If the value matches the override, restores
 * the default value.
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

	// Strip scalar keys managed by overrides
	for ( const key of SCALAR_VALUES ) {
		if ( key in activeViewOverrides ) {
			const { [ key ]: _, ...rest } = result;
			result = rest as View;
		}
	}

	// Strip default-bound values: an unmodified override value is restored
	// to the default view's value; a user-modified value is persisted as is.
	for ( const key of DEFAULT_BOUND_VALUES ) {
		if (
			key in activeViewOverrides &&
			dequal( view[ key ], activeViewOverrides[ key ] )
		) {
			result = {
				...result,
				[ key ]: defaultView?.[ key ],
			} as View;
		}
	}

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

	// Strip layout keys managed by overrides
	if ( activeViewOverrides.layout && 'layout' in result && result.layout ) {
		const layout = { ...result.layout } as Record< string, unknown >;
		for ( const key of Object.keys( activeViewOverrides.layout ) ) {
			delete layout[ key ];
		}
		result = {
			...result,
			layout: Object.keys( layout ).length > 0 ? layout : undefined,
		} as View;
	}

	// Strip groupBy managed by overrides
	if ( activeViewOverrides.groupBy && 'groupBy' in result ) {
		const { groupBy: _, ...rest } = result;
		result = rest as View;
	}

	return result;
}
