/**
 * External dependencies
 */
import { dequal } from 'dequal';

/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import type { View } from '@wordpress/dataviews';
// @ts-ignore - Preferences package is not typed
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { generatePreferenceKey } from './preference-keys';
import { mergeActiveFilters, stripActiveFilterFields } from './filter-utils';
import type { ViewConfig } from './types';

interface UseViewReturn {
	view: View;
	isModified: boolean;
	updateView: ( newView: View ) => void;
	resetToDefault: () => void;
}

function omit< T extends object, K extends keyof T >(
	obj: T,
	keys: K[]
): Omit< T, K > {
	const result = { ...obj };
	for ( const key of keys ) {
		delete result[ key ];
	}
	return result;
}

/**
 * Hook for managing DataViews view state with local persistence.
 *
 * @param config                     Configuration object for loading the view.
 * @param config.kind                Entity kind (e.g., 'postType', 'taxonomy', 'root').
 * @param config.name                Specific entity name.
 * @param config.slug                View identifier.
 * @param config.defaultView         Default view configuration.
 * @param config.activeFilters       Filters applied on top of the view but never persisted.
 * @param config.queryParams         Object with `page` and/or `search` from URL.
 * @param config.onChangeQueryParams Optional callback to update URL parameters.
 *
 * @return Object with current view, modification state, and update functions.
 */
export function useView( config: ViewConfig ): UseViewReturn {
	const {
		kind,
		name,
		slug,
		defaultView,
		activeFilters,
		queryParams,
		onChangeQueryParams,
	} = config;

	const preferenceKey = generatePreferenceKey( kind, name, slug );
	const persistedView: View | undefined = useSelect(
		( select ) => {
			return select( preferencesStore ).get(
				'core/views',
				preferenceKey
			) as View | undefined;
		},
		[ preferenceKey ]
	);
	const { set } = useDispatch( preferencesStore );

	const baseView: View = persistedView ?? defaultView;
	const page = Number( queryParams?.page ?? baseView.page ?? 1 );
	const search = queryParams?.search ?? baseView.search ?? '';

	// Merge URL query parameters (page, search) and activeFilters into the view
	const view: View = useMemo( () => {
		return mergeActiveFilters(
			{
				...baseView,
				page,
				search,
			},
			activeFilters
		);
	}, [ baseView, page, search, activeFilters ] );

	const isModified = !! persistedView;

	const updateView = useCallback(
		( newView: View ) => {
			// Extract URL params (page, search) from the new view
			const urlParams: { page?: number; search?: string } = {
				page: newView?.page,
				search: newView?.search,
			};
			// Strip activeFilters and URL params before persisting
			// Cast is safe: omitting page/search doesn't change the discriminant (type field)
			const preferenceView = stripActiveFilterFields(
				omit( newView, [ 'page', 'search' ] ) as View,
				activeFilters
			);

			// If we have URL handling enabled, separate URL state from preference state
			if (
				onChangeQueryParams &&
				! dequal( urlParams, { page, search } )
			) {
				onChangeQueryParams( urlParams );
			}

			// Compare with baseView and defaultView after stripping activeFilters
			const comparableBaseView = stripActiveFilterFields(
				baseView,
				activeFilters
			);
			const comparableDefaultView = stripActiveFilterFields(
				defaultView,
				activeFilters
			);

			// Only persist non-URL preferences if different from baseView
			if ( ! dequal( comparableBaseView, preferenceView ) ) {
				if ( dequal( preferenceView, comparableDefaultView ) ) {
					set( 'core/views', preferenceKey, undefined );
				} else {
					set( 'core/views', preferenceKey, preferenceView );
				}
			}
		},
		[
			onChangeQueryParams,
			page,
			search,
			baseView,
			defaultView,
			activeFilters,
			set,
			preferenceKey,
		]
	);

	const resetToDefault = useCallback( () => {
		set( 'core/views', preferenceKey, undefined );
	}, [ preferenceKey, set ] );

	return {
		view,
		isModified,
		updateView,
		resetToDefault,
	};
}
