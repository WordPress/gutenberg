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
	const persistedView: View | undefined = select( preferencesStore ).get(
		'core/views',
		preferenceKey
	) as View | undefined;

	const baseView = persistedView ?? defaultView;
	// `page` and `search` are URL-managed: the URL is their only source. They
	// are never persisted, and neither the default view nor the active view
	// overrides may configure them — an absent URL param is indistinguishable
	// from the user having cleared the value, so any fallback would resurrect
	// a cleared search on the next read. These win over whatever `baseView`
	// carries below.
	const page = Number( queryParams?.page ?? 1 );
	const search = queryParams?.search ?? '';

	// Resolve the effective layout type first: a `type` override changes
	// which layout's defaults apply.
	const { type: effectiveType } = mergeActiveViewOverrides(
		{ ...baseView },
		activeViewOverrides,
		defaultView
	);
	const rawDefaults =
		defaultLayouts?.[ effectiveType as keyof typeof defaultLayouts ];
	const layoutTypeDefaults =
		! rawDefaults || rawDefaults === true ? {} : rawDefaults;
	const combinedOverrides = { ...layoutTypeDefaults, ...activeViewOverrides };

	return mergeActiveViewOverrides(
		{
			...baseView,
			page,
			search,
		},
		combinedOverrides,
		defaultView
	);
}
