/**
 * External dependencies
 */
import { dequal } from 'dequal';

/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import type { View, SupportedLayouts } from '@wordpress/dataviews';
// @ts-ignore - Preferences package is not typed
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { generatePreferenceKey } from './preference-keys';
import {
	mergeActiveViewOverrides,
	stripActiveViewOverrides,
} from './filter-utils';
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
 * @param config Configuration object for loading the view.
 *
 * @return Object with current view, modification state, and update functions.
 */
export function useView( config: ViewConfig ): UseViewReturn {
	const {
		kind,
		name,
		slug,
		defaultView,
		defaultLayouts,
		activeViewOverrides,
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

	// Derive layout override for current view type
	const layoutOverride = defaultLayouts?.[
		baseView.type as keyof SupportedLayouts
	]?.layout as Record< string, unknown > | undefined;

	// Combine caller's activeViewOverrides with the derived layout override
	const effectiveOverrides = useMemo( () => {
		if ( ! layoutOverride && ! activeViewOverrides ) {
			return undefined;
		}
		return {
			...activeViewOverrides,
			...( layoutOverride ? { layout: layoutOverride } : {} ),
		};
	}, [ activeViewOverrides, layoutOverride ] );
	const page = Number( queryParams?.page ?? baseView.page ?? 1 );
	const search = queryParams?.search ?? baseView.search ?? '';

	// Merge URL query parameters (page, search) and effective overrides into the view
	const view: View = useMemo( () => {
		return mergeActiveViewOverrides(
			{
				...baseView,
				page,
				search,
			},
			effectiveOverrides,
			defaultView
		);
	}, [ baseView, page, search, effectiveOverrides, defaultView ] );

	const isModified = !! persistedView;

	const updateView = useCallback(
		( newView: View ) => {
			// Extract URL params (page, search) from the new view
			const urlParams: { page?: number; search?: string } = {
				page: newView?.page,
				search: newView?.search,
			};
			// Strip effective overrides and URL params before persisting
			// Cast is safe: omitting page/search doesn't change the discriminant (type field)
			const preferenceView = stripActiveViewOverrides(
				omit( newView, [ 'page', 'search' ] ) as View,
				effectiveOverrides,
				defaultView
			);

			// If we have URL handling enabled, separate URL state from preference state
			if (
				onChangeQueryParams &&
				! dequal( urlParams, { page, search } )
			) {
				onChangeQueryParams( urlParams );
			}

			// Compare with baseView and defaultView after stripping effective overrides
			const comparableBaseView = stripActiveViewOverrides(
				baseView,
				effectiveOverrides,
				defaultView
			);
			const comparableDefaultView = stripActiveViewOverrides(
				defaultView,
				effectiveOverrides,
				defaultView
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
			effectiveOverrides,
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
