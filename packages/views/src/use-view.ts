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
	// a cleared search on the next read. They join the overrides below, which
	// makes them win over `baseView` when merging and drops them when
	// stripping.
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
		return { ...layoutTypeDefaults, ...activeViewOverrides, page, search };
	}, [
		baseView,
		defaultView,
		defaultLayouts,
		activeViewOverrides,
		page,
		search,
	] );

	const view: View = useMemo( () => {
		return mergeOverrides( baseView, overrides, defaultView );
	}, [ baseView, overrides, defaultView ] );

	const isModified = !! persistedView;

	const updateView = useCallback(
		( newView: View ) => {
			const urlParams: { page?: number; search?: string } = {
				page: newView?.page,
				search: newView?.search,
			};
			if (
				onChangeQueryParams &&
				! dequal( urlParams, { page, search } )
			) {
				onChangeQueryParams( urlParams );
			}

			const comparableNewView = stripOverrides(
				newView,
				overrides,
				defaultView
			);
			const comparableBaseView = stripOverrides(
				baseView,
				overrides,
				defaultView
			);
			const comparableDefaultView = stripOverrides(
				defaultView ?? {},
				overrides,
				defaultView
			);

			if ( ! dequal( comparableBaseView, comparableNewView ) ) {
				if ( dequal( comparableNewView, comparableDefaultView ) ) {
					set( 'core/views', preferenceKey, undefined );
				} else {
					set( 'core/views', preferenceKey, comparableNewView );
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
