import { loadView } from '@wordpress/views';
import { dispatch, resolveSelect, select } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import { filterSortAndPaginate } from '@wordpress/dataviews';
import type { View, Field, SupportedLayouts } from '@wordpress/dataviews';
import { unlock } from '@wordpress/routes-lock-unlock';
import type { Template } from './types';

const TEMPLATE_POST_TYPE = 'wp_template';

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
 * Resolves the server-provided view configuration for the template post
 * type, for use in the route loader that runs outside React (where
 * `useViewConfig` is unavailable).
 *
 * @return The entity view configuration.
 */
export async function loadTemplateViewConfig(): Promise< EntityViewConfig > {
	const config = await unlock( resolveSelect( coreStore ) ).getViewConfig(
		'postType',
		TEMPLATE_POST_TYPE
	);
	return {
		default_view: config?.default_view,
		default_layouts: config?.default_layouts,
		view_list: config?.view_list,
	};
}

export async function ensureView(
	activeView?: string,
	search?: { page?: number; search?: string }
) {
	const {
		default_view: defaultView,
		default_layouts: defaultLayouts,
		view_list: viewList,
	} = await loadTemplateViewConfig();
	const slug = activeView ?? 'all';
	if ( ! defaultView ) {
		throw new Error(
			`Missing view configuration for the ${ TEMPLATE_POST_TYPE } post type.`
		);
	}
	return loadView( {
		kind: 'postType',
		name: TEMPLATE_POST_TYPE,
		slug: 'default-new',
		defaultView,
		defaultLayouts,
		activeViewOverrides:
			viewList?.find( ( v ) => v.slug === slug )?.view ?? {},
		queryParams: search,
	} );
}

/**
 * Resolves the post fields of the template post type, for use in the route
 * loader that runs outside React (where `usePostFields` is unavailable).
 *
 * Registering the post type schema is what `usePostFields` does on mount;
 * it is a no-op once the schema is registered.
 *
 * @return The field definitions the stage renders.
 */
export async function loadTemplateFields(): Promise< Field< Template >[] > {
	await unlock( dispatch( editorStore ) ).registerPostTypeSchema(
		TEMPLATE_POST_TYPE
	);
	return unlock( select( editorStore ) ).getEntityFields(
		'postType',
		TEMPLATE_POST_TYPE
	);
}

/**
 * Returns the template the stage selects by default in a list view: the
 * first row after applying the view's search, filters, sort and pagination.
 *
 * The templates endpoint ignores search, ordering and pagination, so the
 * stage fetches every template and applies the view client-side through
 * `filterSortAndPaginate`; this does the same over the same records and
 * field definitions.
 *
 * @param templates Every template, as the stage fetches them.
 * @param view      The resolved view.
 * @param fields    The post fields, as `loadTemplateFields` resolves them.
 * @return The template to preview, if any.
 */
export function getFirstTemplateInView(
	templates: Template[],
	view: View,
	fields: Field< Template >[]
): Template | undefined {
	return filterSortAndPaginate( templates, view, fields ).data[ 0 ];
}
