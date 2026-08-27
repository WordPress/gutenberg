import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { View, SupportedLayouts, Form } from '@wordpress/dataviews';
import { unlock } from '@wordpress/routes-lock-unlock';

/**
 * A layer merged on top of a view. Mirrors the `ViewOverrides` type of
 * `@wordpress/views`, which is not exported.
 */
export type ViewOverrides = Partial< Omit< View, 'type' | 'layout' > > & {
	type?: View[ 'type' ];
	layout?: Record< string, unknown >;
};

export interface ViewListEntry {
	title: string;
	slug: string;
	view?: ViewOverrides;
}

export interface EntityViewConfig {
	default_view: View | undefined;
	default_layouts: SupportedLayouts | undefined;
	view_list: ViewListEntry[] | undefined;
	form: Form | undefined;
}

/**
 * Resolves the server-provided view configuration for an entity, for use in
 * route loaders that run outside React (where `useViewConfig` is unavailable).
 *
 * @param kind Entity kind (e.g. `postType`).
 * @param name Entity name (e.g. `wp_navigation`).
 * @return The entity view configuration.
 */
export async function loadEntityViewConfig(
	kind: string,
	name: string
): Promise< EntityViewConfig > {
	const config = await unlock( resolveSelect( coreStore ) ).getViewConfig(
		kind,
		name
	);
	return {
		default_view: config?.default_view,
		default_layouts: config?.default_layouts,
		view_list: config?.view_list,
		form: config?.form,
	};
}

/**
 * Returns the view overrides of the entry in the view list matching the
 * given slug, or an empty object when there is none.
 *
 * @param viewList The `view_list` of an entity view configuration.
 * @param slug     Slug of the active view.
 * @return The view overrides for the active view.
 */
export function getActiveViewOverrides(
	viewList: ViewListEntry[] | undefined,
	slug: string
): ViewOverrides {
	return viewList?.find( ( v ) => v.slug === slug )?.view ?? {};
}
