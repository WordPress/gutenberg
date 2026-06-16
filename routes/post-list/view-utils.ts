/**
 * WordPress dependencies
 */
import { loadView } from '@wordpress/views';
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { Type } from '@wordpress/core-data';
import type {
	View,
	Filter,
	SupportedLayouts,
	ViewTable,
} from '@wordpress/dataviews';

export const TEMPLATE_PAGE_ITEM_ID_PREFIX = 'template:';

const DEFAULT_VIEW: View = {
	type: 'table' as const,
	sort: {
		field: 'date',
		direction: 'desc' as const,
	},
	fields: [ 'author', 'status', 'date' ],
	titleField: 'title',
	mediaField: 'featured_media',
	descriptionField: 'excerpt',
};

const DEFAULT_PAGE_VIEW: View = {
	...DEFAULT_VIEW,
	type: 'grid' as const,
	mediaField: 'content-preview',
};

const DEFAULT_TABLE_LAYOUT: Omit< ViewTable, 'type' > = {
	layout: {
		styles: {
			author: {
				align: 'start',
			},
		},
	},
};

export const DEFAULT_LAYOUTS: SupportedLayouts = {
	table: DEFAULT_TABLE_LAYOUT,
	grid: true,
	list: true,
};

export const DEFAULT_TEMPLATE_VIEW: View = {
	type: 'grid' as const,
	search: '',
	filters: [],
	page: 1,
	perPage: 20,
	sort: {
		field: 'title',
		direction: 'asc' as const,
	},
	fields: [ 'author', 'active', 'slug' ],
	titleField: 'title',
	descriptionField: 'description',
	mediaField: 'preview',
};

export const DEFAULT_TEMPLATE_LAYOUTS: SupportedLayouts = {
	table: {
		showMedia: false,
	},
	grid: {
		showMedia: true,
	},
	list: {
		showMedia: false,
	},
};

type ActiveViewOverrides = {
	filters?: Filter[];
	sort?: View[ 'sort' ];
	layout?: Record< string, unknown >;
};

export function getActiveViewOverridesForTab(): ActiveViewOverrides {
	return {
		...DEFAULT_TABLE_LAYOUT,
	};
}

export function getTemplateViewSlug( postType: string ) {
	return `post-list-${ postType }-templates`;
}

export function getPostTypeViewSlug( postType: string ) {
	return `post-list-${ postType }-content`;
}

export function getTemplatePageItemId( templateId: string | number ) {
	return `${ TEMPLATE_PAGE_ITEM_ID_PREFIX }${ templateId }`;
}

export function getTemplateIdFromPageItemId( itemId: string ) {
	if ( ! itemId.startsWith( TEMPLATE_PAGE_ITEM_ID_PREFIX ) ) {
		return undefined;
	}

	return itemId.slice( TEMPLATE_PAGE_ITEM_ID_PREFIX.length );
}

export function getDefaultView( postType: Type | undefined ): View {
	return {
		...( postType?.slug === 'page' ? DEFAULT_PAGE_VIEW : DEFAULT_VIEW ),
		showLevels: postType?.hierarchical,
	};
}

export async function ensureView(
	type: string,
	_slug?: string,
	search?: { page?: number; search?: string }
) {
	const postTypeObject = await resolveSelect( coreStore ).getPostType( type );
	const defaultView = getDefaultView( postTypeObject );
	return loadView( {
		kind: 'postType',
		name: type,
		slug: getPostTypeViewSlug( type ),
		defaultView,
		activeViewOverrides: getActiveViewOverridesForTab(),
		queryParams: search,
	} );
}

export async function ensureTemplateView(
	postType: string,
	search?: { page?: number; search?: string }
) {
	return loadView( {
		kind: 'postType',
		name: 'wp_template',
		slug: getTemplateViewSlug( postType ),
		defaultView: DEFAULT_TEMPLATE_VIEW,
		activeViewOverrides: {},
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
		result.status = Array.isArray( status.value )
			? status.value.join( ',' )
			: status.value;
	} else if ( postType === 'attachment' ) {
		result.status = 'inherit';
	} else {
		result.status = 'draft,future,pending,private,publish';
	}

	const author = view.filters?.find(
		( filter ) => filter.field === 'author'
	);
	if ( author && [ 'is', 'isAny' ].includes( author.operator ) ) {
		result.author = Array.isArray( author.value )
			? author.value.join( ',' )
			: author.value;
	} else if ( author && [ 'isNot', 'isNone' ].includes( author.operator ) ) {
		result.author_exclude = Array.isArray( author.value )
			? author.value.join( ',' )
			: author.value;
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

export function templateViewToQuery( view: View, postType: string ) {
	const result: Record< string, any > = {
		per_page: -1,
		post_type: postType,
	};

	if ( undefined !== view.page ) {
		result.page = view.page;
	}

	if ( ! [ undefined, '' ].includes( view.search ) ) {
		result.search = view.search;
	}

	if ( undefined !== view.sort?.field ) {
		result.orderby = view.sort.field;
	}

	if ( undefined !== view.sort?.direction ) {
		result.order = view.sort.direction;
	}

	return result;
}
