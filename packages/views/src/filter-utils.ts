/**
 * WordPress dependencies
 */
import type { View, Filter } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import type { ActiveViewOverrides } from './types';

const SCALAR_VALUES = [
	'type',
	'perPage',
	'fields',
	'titleField',
	'mediaField',
	'descriptionField',
	'showTitle',
	'showMedia',
	'showDescription',
	'showLevels',
	'infiniteScrollEnabled',
] as const;

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

	// Merge scalar overrides — always win over persisted values
	for ( const key of SCALAR_VALUES ) {
		if ( key in activeViewOverrides ) {
			result = { ...result, [ key ]: activeViewOverrides[ key ] };
		}
	}

	// Merge filters.
	// Locked filters (`isLocked: true`) always win over whatever the user has
	// set for that field. Unlocked filters only seed a default value for
	// fields the view doesn't already have a filter for — once a filter
	// exists for that field (e.g. because the user added/edited it), the
	// unlocked override no longer clobbers it.
	if (
		activeViewOverrides.filters &&
		activeViewOverrides.filters.length > 0
	) {
		const lockedOverrides = activeViewOverrides.filters.filter(
			( f: Filter ) => !! f.isLocked
		);
		const lockedFields = new Set( lockedOverrides.map( ( f ) => f.field ) );
		const preserved = ( view.filters ?? [] ).filter(
			( f: Filter ) => ! lockedFields.has( f.field )
		);
		const existingFields = new Set(
			preserved.map( ( f: Filter ) => f.field )
		);
		const unlockedDefaults = activeViewOverrides.filters.filter(
			( f: Filter ) => ! f.isLocked && ! existingFields.has( f.field )
		);
		result = {
			...result,
			filters: [ ...preserved, ...lockedOverrides, ...unlockedDefaults ],
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

	// Strip scalar keys managed by overrides
	for ( const key of SCALAR_VALUES ) {
		if ( key in activeViewOverrides ) {
			const { [ key ]: _, ...rest } = result;
			result = rest as View;
		}
	}

	// Strip managed filters.
	// Only locked filters are force-managed and excluded from persistence;
	// unlocked ones are just a seeded default, so any value the user set for
	// that field (including edits to the seeded filter) persists normally.
	if (
		activeViewOverrides.filters &&
		activeViewOverrides.filters.length > 0
	) {
		const lockedFields = new Set(
			activeViewOverrides.filters
				.filter( ( f: Filter ) => !! f.isLocked )
				.map( ( f ) => f.field )
		);
		result = {
			...result,
			filters: ( view.filters ?? [] ).filter(
				( f: Filter ) => ! lockedFields.has( f.field )
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
