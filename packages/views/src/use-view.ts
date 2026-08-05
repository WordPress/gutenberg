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
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { generatePreferenceKey } from './preference-keys';
import { getUserModifications, resolveView } from './resolve-view';
import type { ViewConfig, ViewOverrides } from './types';

interface UseViewReturn {
	view: View;
	isModified: boolean;
	updateView: ( newView: View ) => void;
	resetToDefault: () => void;
}

/**
 * Hook for managing DataViews view state with local persistence.
 *
 * Only the properties the user actually modified are persisted: every other
 * property keeps resolving out of the layers below, so a change to the default
 * view, to the layout defaults or to the active view overrides keeps showing
 * through.
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
	const persistedView: ViewOverrides | undefined = useSelect(
		( select ) => {
			return select( preferencesStore ).get(
				'core/views',
				preferenceKey
			) as ViewOverrides | undefined;
		},
		[ preferenceKey ]
	);
	const { set } = useDispatch( preferencesStore );

	const page = Number( queryParams?.page ?? 1 );
	const search = queryParams?.search ?? '';

	const view = useMemo(
		() =>
			resolveView( {
				defaultView,
				defaultLayouts,
				activeViewOverrides,
				persistedView,
				page,
				search,
			} ),
		[
			defaultView,
			defaultLayouts,
			activeViewOverrides,
			persistedView,
			page,
			search,
		]
	);

	const isModified =
		!! persistedView && Object.keys( persistedView ).length > 0;

	const updateView = useCallback(
		( newView: View ) => {
			// `page` and `search` live in the URL, not in the preference: they
			// are reported back to the consumer instead of being persisted.
			const newQueryParams = {
				page: Number( newView?.page ?? 1 ),
				search: newView?.search ?? '',
			};
			if (
				onChangeQueryParams &&
				! dequal( newQueryParams, { page, search } )
			) {
				onChangeQueryParams( newQueryParams );
			}

			const modifications = getUserModifications( newView, {
				defaultView,
				defaultLayouts,
				activeViewOverrides,
				persistedView,
			} );
			if ( ! dequal( modifications, persistedView ) ) {
				// `undefined` clears the preference: the user reverted every
				// property they had modified.
				set( 'core/views', preferenceKey, modifications );
			}
		},
		[
			onChangeQueryParams,
			page,
			search,
			defaultView,
			defaultLayouts,
			activeViewOverrides,
			persistedView,
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
