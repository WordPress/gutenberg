/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';
// @ts-ignore - Preferences package is not typed
import { store as preferencesStore } from '@wordpress/preferences';
import type { View } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import { generatePreferenceKey } from './preference-keys';
import { mergeActiveViewOverrides } from './filter-utils';
import type { ViewConfig } from './types';

/**
 * Async function for loading view state in route loaders.
 *
 * @param config                     Configuration object for loading the view.
 * @param config.kind                Entity kind (e.g., 'postType', 'taxonomy', 'root').
 * @param config.name                Specific entity name.
 * @param config.slug                View identifier.
 * @param config.defaultView         Default view configuration.
 * @param config.activeViewOverrides View overrides applied on top but never persisted.
 * @param config.queryParams         Object with `page` and/or `search` from URL.
 * @return Promise resolving to the loaded view object.
 */
export async function loadView( config: ViewConfig ) {
	const { kind, name, slug, defaultView, activeViewOverrides, queryParams } =
		config;
	const preferenceKey = generatePreferenceKey( kind, name, slug );
	const persistedView: View | undefined = select( preferencesStore ).get(
		'core/views',
		preferenceKey
	) as View | undefined;

	const baseView = persistedView ?? defaultView;
	const page = queryParams?.page ?? 1;
	const search = queryParams?.search ?? '';

	return mergeActiveViewOverrides(
		{
			...baseView,
			page,
			search,
		},
		activeViewOverrides,
		defaultView
	);
}
