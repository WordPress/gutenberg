import { loadView } from '@wordpress/views';
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import type { View, Filter, SupportedLayouts } from '@wordpress/dataviews';
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

export async function ensureView(
	activeView?: string,
	search?: { page?: number; search?: string }
) {
	const {
		default_view: defaultView,
		default_layouts: defaultLayouts,
		view_list: viewList,
	} = await loadTemplateViewConfig();
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
		activeViewOverrides: getActiveViewOverrides(
			viewList,
			activeView ?? 'all'
		),
		queryParams: search,
	} );
}

type SortableValue = string | number | undefined;

/**
 * Values of the fields the stage lets the view filter, search and sort by.
 * They mirror `getValue` of the field definitions the stage renders.
 */
const FIELD_VALUES: Record< string, ( template: Template ) => SortableValue > =
	{
		title: ( template ) =>
			decodeEntities(
				template.title?.rendered ?? template.title?.raw ?? ''
			),
		description: ( template ) => template.description,
		author: ( template ) => template.author_text ?? template.author,
	};

// The fields with `enableGlobalSearch`.
const SEARCHABLE_FIELDS = [ 'title', 'description' ];

// The fields DataViews can sort by (the others set `enableSorting: false`).
const SORTABLE_FIELDS = [ 'title', 'author' ];

function normalizeSearchInput( input: string ) {
	// Strip the combining diacritical marks left by the NFD decomposition,
	// which approximates the accent removal DataViews applies.
	return input
		.trim()
		.toLowerCase()
		.normalize( 'NFD' )
		.replace( /[\u0300-\u036f]/g, '' );
}

function matchesFilter( template: Template, filter: Filter ) {
	const getValue = FIELD_VALUES[ filter.field ];
	if ( ! getValue ) {
		return true;
	}
	const value = getValue( template );
	switch ( filter.operator ) {
		case 'is':
			return filter.value === undefined || filter.value === value;
		case 'isNot':
			return filter.value !== value;
		case 'isAny':
			return ! filter.value?.length || filter.value.includes( value );
		case 'isNone':
			return ! filter.value?.length || ! filter.value.includes( value );
		default:
			return true;
	}
}

function compare( a: SortableValue, b: SortableValue ) {
	if ( typeof a === 'number' && typeof b === 'number' ) {
		return a - b;
	}
	return String( a ?? '' ).localeCompare( String( b ?? '' ) );
}

/**
 * Returns the template the stage selects by default in a list view: the
 * first row after applying the view's search, filters, sort and pagination.
 *
 * The templates endpoint ignores search, ordering and pagination, so the
 * stage fetches every template and applies the view client-side through
 * `filterSortAndPaginate`; this does the same over the same records.
 *
 * @param templates Every template, as the stage fetches them.
 * @param view      The resolved view.
 * @return The template to preview, if any.
 */
export function getFirstTemplateInView(
	templates: Template[],
	view: View
): Template | undefined {
	let result = templates;

	if ( view.search ) {
		const search = normalizeSearchInput( view.search );
		result = result.filter( ( template ) =>
			SEARCHABLE_FIELDS.some( ( field ) =>
				normalizeSearchInput(
					String( FIELD_VALUES[ field ]( template ) ?? '' )
				).includes( search )
			)
		);
	}

	for ( const filter of view.filters ?? [] ) {
		result = result.filter( ( template ) =>
			matchesFilter( template, filter )
		);
	}

	const sortField = view.sort?.field;
	if ( sortField && SORTABLE_FIELDS.includes( sortField ) ) {
		const getValue = FIELD_VALUES[ sortField ];
		const direction = view.sort?.direction === 'asc' ? 1 : -1;
		result = [ ...result ].sort(
			( a, b ) => direction * compare( getValue( a ), getValue( b ) )
		);
	}

	const offset =
		view.page !== undefined && view.perPage !== undefined
			? ( view.page - 1 ) * view.perPage
			: 0;

	return result[ offset ];
}
