import { select } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { generatePreferenceKey } from './preference-keys';
import { resolveView } from './resolve-view';
import type { ViewConfig, ViewOverrides } from './types';

/**
 * Async function for loading view state in route loaders.
 *
 * Resolves the same layers `useView` does, so a route loader and the hook that
 * takes over from it agree on the view.
 *
 * @param config                     Configuration object for loading the view.
 * @param config.kind                Entity kind (e.g., 'postType', 'taxonomy', 'root').
 * @param config.name                Specific entity name.
 * @param config.slug                View identifier.
 * @param config.defaultView         Default view configuration.
 * @param config.defaultLayouts      Default layout configurations keyed by layout type.
 * @param config.activeViewOverrides View overrides applied on top but never persisted.
 * @param config.queryParams         Object with `page` and/or `search` from URL.
 * @return Promise resolving to the loaded view object.
 */
export async function loadView( config: ViewConfig ) {
	const {
		kind,
		name,
		slug,
		defaultView,
		defaultLayouts,
		activeViewOverrides,
		queryParams,
	} = config;
	const preferenceKey = generatePreferenceKey( kind, name, slug );
	const persistedView: ViewOverrides | undefined = select(
		preferencesStore
	).get( 'core/views', preferenceKey ) as ViewOverrides | undefined;

	return resolveView( {
		defaultView,
		defaultLayouts,
		activeViewOverrides,
		persistedView,
		page: queryParams?.page,
		search: queryParams?.search,
	} );
}
