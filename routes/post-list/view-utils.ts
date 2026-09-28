import { loadView } from '@wordpress/views';
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { View, SupportedLayouts } from '@wordpress/dataviews';
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

interface EntityViewConfig {
	default_view: View | undefined;
	default_layouts: SupportedLayouts | undefined;
	view_list: ViewListEntry[] | undefined;
}

/**
 * Resolves the server-provided view configuration for the given post type,
 * for use in the route loader that runs outside React (where `useViewConfig`
 * is unavailable).
 *
 * @param postType The post type name.
 * @return The entity view configuration.
 */
export async function loadPostTypeViewConfig(
	postType: string
): Promise< EntityViewConfig > {
	const config = await unlock( resolveSelect( coreStore ) ).getViewConfig(
		'postType',
		postType
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
	type: string,
	slug?: string,
	search?: { page?: number; search?: string }
) {
	const {
		default_view: defaultView,
		default_layouts: defaultLayouts,
		view_list: viewList,
	} = await loadPostTypeViewConfig( type );
	if ( ! defaultView ) {
		throw new Error(
			`Missing view configuration for the ${ type } post type.`
		);
	}
	return loadView( {
		kind: 'postType',
		name: type,
		slug: 'default-new',
		defaultView,
		defaultLayouts,
		activeViewOverrides: getActiveViewOverrides( viewList, slug ?? 'all' ),
		queryParams: search,
	} );
}
export function viewToQuery( view: View, postType: string ) {
	const result: Record< string, any > = { _embed: 'author,wp:featuredmedia' };

	// Pagination, sorting, search.
	if ( undefined !== view.perPage ) {
		result.per_page = view.perPage;
	}

	if ( undefined !== view.page ) {
		result.page = view.page;
	}

	if ( ! [ undefined, '' ].includes( view.search ) ) {
		result.search = view.search;
	}

	if ( undefined !== view.sort?.field ) {
		let sortField = view.sort.field;

		if ( sortField === 'attached_to' ) {
			sortField = 'parent';
		}

		result.orderby = sortField;
	}

	if ( undefined !== view.sort?.direction ) {
		result.order = view.sort.direction;
	}

	if ( view.showLevels ) {
		result.orderby_hierarchy = true;
	}

	// Filters.
	const status = view.filters?.find(
		( filter ) => filter.field === 'status'
	);
	if ( status ) {
		result.status = status.value;
	} else if ( postType === 'attachment' ) {
		result.status = 'inherit';
	} else {
		result.status = 'draft,future,pending,private,publish';
	}

	const author = view.filters?.find(
		( filter ) => filter.field === 'author'
	);
	if ( author && author.operator === 'is' ) {
		result.author = author.value;
	} else if ( author && author.operator === 'isNot' ) {
		result.author_exclude = author.value;
	}

	const commentStatus = view.filters?.find(
		( filter ) => filter.field === 'comment_status'
	);
	if ( commentStatus && commentStatus.operator === 'is' ) {
		result.comment_status = commentStatus.value;
	} else if ( commentStatus && commentStatus.operator === 'isNot' ) {
		result.comment_status_exclude = commentStatus.value;
	}

	const mediaType = view.filters?.find(
		( filter ) => filter.field === 'media_type'
	);

	if ( mediaType ) {
		result.media_type = mediaType.value;
	}

	const date = view.filters?.find( ( filter ) => filter.field === 'date' );
	if ( date && date.value ) {
		if ( date.operator === 'before' ) {
			result.before = date.value;
		} else if ( date.operator === 'after' ) {
			result.after = date.value;
		}
	}

	// For attachments, we need to embed the parent (attached to) post to get its title.
	if ( postType === 'attachment' ) {
		result._embed = 'wp:attached-to';
	}

	return result;
}
