import { loadView } from '@wordpress/views';
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { View, SupportedLayouts } from '@wordpress/dataviews';
import { unlock } from '@wordpress/routes-lock-unlock';

const TEMPLATE_PART_POST_TYPE = 'wp_template_part';

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

interface EntityViewConfig {
	default_view: View | undefined;
	default_layouts: SupportedLayouts | undefined;
	view_list: ViewListEntry[] | undefined;
}

/**
 * Resolves the server-provided view configuration for the template part
 * post type, for use in the route loader that runs outside React (where
 * `useViewConfig` is unavailable).
 *
 * @return The entity view configuration.
 */
export async function loadTemplatePartViewConfig(): Promise< EntityViewConfig > {
	const config = await unlock( resolveSelect( coreStore ) ).getViewConfig(
		'postType',
		TEMPLATE_PART_POST_TYPE
	);
	return {
		default_view: config?.default_view,
		default_layouts: config?.default_layouts,
		view_list: config?.view_list,
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

/**
 * Returns the template part area the given view overrides lock the list to,
 * or `undefined` when they list every area.
 *
 * @param viewOverrides The view overrides of the active view.
 * @return The template part area, if any.
 */
export function getAreaFromViewOverrides(
	viewOverrides: ViewOverrides
): string | undefined {
	const areaFilter = viewOverrides.filters?.find(
		( filter ) => filter.field === 'area'
	);
	return typeof areaFilter?.value === 'string' ? areaFilter.value : undefined;
}

export async function ensureView(
	area: string,
	search?: { page?: number; search?: string }
) {
	const {
		default_view: defaultView,
		default_layouts: defaultLayouts,
		view_list: viewList,
	} = await loadTemplatePartViewConfig();
	if ( ! defaultView ) {
		throw new Error(
			`Missing view configuration for the ${ TEMPLATE_PART_POST_TYPE } post type.`
		);
	}
	return loadView( {
		kind: 'postType',
		name: TEMPLATE_PART_POST_TYPE,
		slug: 'default-new',
		defaultView,
		defaultLayouts,
		activeViewOverrides: getActiveViewOverrides( viewList, area ),
		queryParams: search,
	} );
}

export function viewToQuery( view: View ) {
	// The endpoint only supports `area`. Everything else is handled client-side.
	const result: Record< string, any > = { per_page: -1 };

	const areaFilter = view.filters?.find(
		( filter ) => filter.field === 'area'
	);
	if ( areaFilter ) {
		result.area = areaFilter.value;
	}

	return result;
}
