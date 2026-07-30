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
import type { Overrides } from './types';

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

// Values managed by the URL: they behave like scalar values (they always win
// over the persisted view and are never persisted), but they are never
// configured by the developer — the URL is their only source.
const URL_MANAGED_VALUES = [ 'page', 'search' ] as const;

// Values that act as developer-provided defaults: the override applies only
// while the view still matches the default view, so an explicit user
// modification wins over the override (and gets persisted).
const DEFAULT_BOUND_VALUES = [ 'type', 'perPage', 'fields' ] as const;

const ALWAYS_WINS_VALUES = [ ...SCALAR_VALUES, ...URL_MANAGED_VALUES ] as const;

/**
 * Merges the resolved overrides into a view.
 * Filters: Locked filters always replace same-field filters; unlocked filters
 * apply only while the user has no filter of their own for the field.
 * Sort, type, perPage, fields: Applied only if the current value matches the
 * default, so user modifications win.
 * Page, search: always win, whatever the view carries.
 *
 * @param view                The view to merge overrides into.
 * @param activeViewOverrides The overrides to apply.
 * @param defaultView         The default view configuration.
 * @return A new view with merged overrides, or the original view if no overrides.
 */
export function mergeOverrides(
	view: View,
	activeViewOverrides?: Overrides,
	defaultView?: View
): View {
	if ( ! activeViewOverrides ) {
		return view;
	}

	let result = view;

	// Merge scalar and URL-managed overrides — always win over persisted values
	for ( const key of ALWAYS_WINS_VALUES ) {
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

	// Merge filters. Locked filters always apply, replacing any same-field
	// filter. Unlocked filters act as defaults: they apply only while the
	// user has no filter of their own for the field (none at all, or one
	// that still matches the default view).
	if (
		activeViewOverrides.filters &&
		activeViewOverrides.filters.length > 0
	) {
		const viewFilters = view.filters ?? [];
		const applied = activeViewOverrides.filters.filter( ( override ) => {
			if ( override.isLocked ) {
				return true;
			}
			const current = viewFilters.find(
				( f: Filter ) => f.field === override.field
			);
			const defaultFilter = defaultView?.filters?.find(
				( f: Filter ) => f.field === override.field
			);
			return ! current || dequal( current, defaultFilter );
		} );
		const appliedFields = new Set( applied.map( ( f ) => f.field ) );
		const preserved = viewFilters.filter(
			( f: Filter ) => ! appliedFields.has( f.field )
		);
		result = {
			...result,
			filters: [ ...preserved, ...applied ],
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
 * Filters: Locked filters are never persisted; unlocked filters are restored
 * to the default view's filter unless the user modified them.
 * Sort, type, perPage, fields: If the value matches the override, restores
 * the default value.
 * Page, search: never persisted.
 *
 * @param view                The view to strip overrides from.
 * @param activeViewOverrides The override definitions.
 * @param defaultView         The default view configuration.
 * @return A new view with overrides stripped, or the original view if no overrides.
 */
export function stripOverrides(
	view: View,
	activeViewOverrides?: Overrides,
	defaultView?: View
): View {
	if ( ! activeViewOverrides ) {
		return view;
	}

	let result = view;

	// Strip scalar and URL-managed keys managed by overrides
	for ( const key of ALWAYS_WINS_VALUES ) {
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

	// Strip managed filters. Filters managed by a locked override are never
	// persisted. For unlocked overrides, an unmodified filter is restored to
	// the default view's filter (if any); a user-modified filter is
	// persisted as is.
	if (
		activeViewOverrides.filters &&
		activeViewOverrides.filters.length > 0
	) {
		const overrideFilters = activeViewOverrides.filters;
		const strippedFilters: Filter[] = [];
		for ( const filter of view.filters ?? [] ) {
			const override = overrideFilters.find(
				( f ) => f.field === filter.field
			);
			if ( ! override ) {
				strippedFilters.push( filter );
				continue;
			}
			if ( override.isLocked ) {
				continue;
			}
			if ( dequal( filter, override ) ) {
				const defaultFilter = defaultView?.filters?.find(
					( f: Filter ) => f.field === filter.field
				);
				if ( defaultFilter ) {
					strippedFilters.push( defaultFilter );
				}
				continue;
			}
			strippedFilters.push( filter );
		}
		result = {
			...result,
			filters: strippedFilters,
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
