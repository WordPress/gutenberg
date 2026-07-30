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
import { mergeOverrides, stripOverrides } from './filter-utils';
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

	const baseView: View = useMemo(
		() => persistedView ?? defaultView ?? {},
		[ persistedView, defaultView ]
	);
	// `page` and `search` are URL-managed: the URL is their only source. They
	// are never persisted, and neither the default view nor the active view
	// overrides may configure them — an absent URL param is indistinguishable
	// from the user having cleared the value, so any fallback would resurrect
	// a cleared search on the next read. These win over whatever `baseView`
	// carries below.
	const page = Number( queryParams?.page ?? 1 );
	const search = queryParams?.search ?? '';

	const overrides = useMemo( () => {
		// Resolve the effective layout type first: a `type` override changes
		// which layout's defaults apply.
		const { type: effectiveType } = mergeOverrides(
			baseView,
			activeViewOverrides,
			defaultView
		);
		const rawDefaults =
			defaultLayouts?.[ effectiveType as keyof typeof defaultLayouts ];
		const layoutTypeDefaults =
			! rawDefaults || rawDefaults === true ? {} : rawDefaults;
		return { ...layoutTypeDefaults, ...activeViewOverrides };
	}, [ defaultLayouts, baseView, activeViewOverrides, defaultView ] );

	// Merge URL query parameters (page, search) and activeViewOverrides into the view
	const view: View = useMemo( () => {
		return mergeOverrides(
			{
				...baseView,
				page,
				search,
			},
			overrides,
			defaultView
		);
	}, [ baseView, page, search, overrides, defaultView ] );

	const isModified = !! persistedView;

	const updateView = useCallback(
		( newView: View ) => {
			// Extract URL params (page, search) from the new view
			const urlParams: { page?: number; search?: string } = {
				page: newView?.page,
				search: newView?.search,
			};
			// Strip activeViewOverrides and URL params before persisting
			// Cast is safe: omitting page/search doesn't change the discriminant (type field)
			const preferenceView = stripOverrides(
				omit( newView, [ 'page', 'search' ] ) as View,
				overrides,
				defaultView
			);

			// If we have URL handling enabled, separate URL state from preference state
			if (
				onChangeQueryParams &&
				! dequal( urlParams, { page, search } )
			) {
				onChangeQueryParams( urlParams );
			}

			// Compare with baseView and defaultView after stripping
			// activeViewOverrides and the URL params (page, search), which the
			// preference view never carries.
			const comparableBaseView = stripOverrides(
				omit( baseView, [ 'page', 'search' ] ) as View,
				overrides,
				defaultView
			);
			const comparableDefaultView = stripOverrides(
				omit( defaultView ?? {}, [ 'page', 'search' ] ) as View,
				overrides,
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
			overrides,
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
