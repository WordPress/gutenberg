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
import type { ViewOverrides } from './types';

const OVERRIDES_WIN_IF_NO_USER_VALUE = [ 'type', 'perPage', 'fields' ] as const;

const OVERRIDES_ALWAYS_WIN = [
	// These cannot be modified by the user:
	'titleField',
	'mediaField',
	'descriptionField',
	'showTitle',
	'showMedia',
	'showDescription',
	'showLevels',
	'infiniteScrollEnabled',
	// These are query parameters:
	'page',
	'search',
] as const;

/**
 * Merges the overrides into a view.
 *
 * @param view        The view to merge overrides into.
 * @param overrides   The overrides to apply.
 * @param defaultView The default view configuration.
 * @return A new view with merged overrides, or the original view if no overrides.
 */
export function mergeOverrides(
	view: View,
	overrides: ViewOverrides | undefined,
	defaultView: View
): View {
	if ( ! overrides ) {
		return view;
	}

	let result = view;

	// These overrides are always merged, regardless of whether the user has modified the view.
	for ( const key of OVERRIDES_ALWAYS_WIN ) {
		if ( key in overrides ) {
			result = { ...result, [ key ]: overrides[ key ] };
		}
	}

	if ( overrides.layout ) {
		result = {
			...result,
			layout: {
				...( result as any ).layout,
				...overrides.layout,
			},
		} as View;
	}

	if ( overrides.groupBy ) {
		result = {
			...result,
			groupBy: {
				...( result as any ).groupBy,
				...overrides.groupBy,
			},
		};
	}

	// These overrides are merged only if the user has not modified the view
	// (i.e., the current value matches the default view).
	for ( const key of OVERRIDES_WIN_IF_NO_USER_VALUE ) {
		if ( key in overrides && dequal( view[ key ], defaultView[ key ] ) ) {
			result = {
				...result,
				[ key ]: overrides[ key ],
			} as View;
		}
	}

	// Merge filters managed by overrides:
	//
	// - Locked: merge always, replacing any same-field filter.
	// - Unlocked: act as defaults. They apply only while the
	//   user has no filter of their own for the field
	//   (none at all, or one that still matches the default view).
	if ( overrides.filters && overrides.filters.length > 0 ) {
		const overrideFilters = overrides.filters;
		const viewFilters = view.filters ?? [];
		const shouldApplyOverride = ( override: Filter ) => {
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
		};

		// Walk the current view's filters so their order is preserved: an
		// applied override replaces the same-field filter in place.
		const mergedFilters: Filter[] = [];
		for ( const filter of viewFilters ) {
			const override = overrideFilters.find(
				( f ) => f.field === filter.field
			);
			mergedFilters.push(
				override && shouldApplyOverride( override ) ? override : filter
			);
		}

		// Then append the applied overrides for fields not in the view.
		for ( const override of overrideFilters ) {
			const inView = viewFilters.some(
				( f: Filter ) => f.field === override.field
			);
			if ( ! inView && shouldApplyOverride( override ) ) {
				mergedFilters.push( override );
			}
		}

		result = {
			...result,
			filters: [
				...mergedFilters.filter( ( f ) => f.isLocked ),
				...mergedFilters.filter( ( f ) => ! f.isLocked ),
			],
		};
	}

	if ( overrides.sort && dequal( view.sort, defaultView.sort ) ) {
		result = {
			...result,
			sort: {
				...( result as any ).sort,
				...overrides.sort,
			},
		};
	}

	return result;
}

/**
 * Strips overrides before persisting.
 *
 * @param view        The view to strip overrides from.
 * @param overrides   The override definitions.
 * @param defaultView The default view configuration.
 * @return A new view with overrides stripped, or the original view if no overrides.
 */
export function stripOverrides(
	view: View,
	overrides: ViewOverrides | undefined,
	defaultView: View
): View {
	if ( ! overrides ) {
		return view;
	}

	let result = view;

	// These overrides are always removed (so they are never persisted).
	for ( const key of OVERRIDES_ALWAYS_WIN ) {
		if ( key in overrides ) {
			const { [ key ]: _, ...rest } = result;
			result = rest as View;
		}
	}

	if ( overrides.layout && result.layout ) {
		const layout = { ...result.layout } as Record< string, unknown >;
		for ( const key of Object.keys( overrides.layout ) ) {
			delete layout[ key ];
		}
		result = {
			...result,
			layout: Object.keys( layout ).length > 0 ? layout : undefined,
		} as View;
	}

	if ( overrides.groupBy && result.groupBy ) {
		const groupBy = { ...result.groupBy } as Record< string, unknown >;
		for ( const key of Object.keys( overrides.groupBy ) ) {
			delete groupBy[ key ];
		}
		result = {
			...result,
			groupBy: Object.keys( groupBy ).length > 0 ? groupBy : undefined,
		} as View;
	}

	// These overrides are removed only if the user has not modified the view
	// (i.e., the current value matches the override value).
	for ( const key of OVERRIDES_WIN_IF_NO_USER_VALUE ) {
		if ( key in overrides && dequal( view[ key ], overrides[ key ] ) ) {
			result = {
				...result,
				[ key ]: defaultView?.[ key ],
			} as View;
		}
	}

	// Strip filters managed by overrides:
	//
	// - Locked: removed, never persisted.
	// - Unlocked: an unmodified filter is restored to the default view's filter (if any);
	//   a user-modified filter is persisted as is.
	if ( overrides.filters && overrides.filters.length > 0 ) {
		const overrideFilters = overrides.filters;
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

	// The sort override may be partial: the merged sort is the default view's
	// sort with the override's keys on top. Compare against that merged shape,
	// otherwise a partial override would look user-modified and be persisted.
	if (
		overrides.sort &&
		dequal( view.sort, {
			...( defaultView?.sort as any ),
			...overrides.sort,
		} )
	) {
		result = {
			...result,
			sort: defaultView?.sort,
		};
	}

	return result;
}
