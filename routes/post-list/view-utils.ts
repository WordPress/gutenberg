/**
 * WordPress dependencies
 */
import { loadView } from '@wordpress/views';
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { Type } from '@wordpress/core-data';
import type { View, Filter } from '@wordpress/dataviews';

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

export const DEFAULT_LAYOUTS = {
	table: {},
	grid: {},
	list: {},
};

export const DEFAULT_VIEWS: {
	slug: string;
	label: string;
}[] = [
	{
		slug: 'all',
		label: 'All',
	},
	{
		slug: 'publish',
		label: 'Published',
	},
	{
		slug: 'draft',
		label: 'Draft',
	},
	{
		slug: 'pending',
		label: 'Pending',
	},
	{
		slug: 'private',
		label: 'Private',
	},
	{
		slug: 'trash',
		label: 'Trash',
	},
];

export function getActiveFiltersForTab( slug: string ): Filter[] {
	if ( slug === 'all' ) {
		return [];
	}
	return [
		{
			field: 'status',
			operator: 'is',
			value: slug,
		},
	];
}

export function getDefaultView( postType: Type | undefined ): View {
	return {
		...DEFAULT_VIEW,
		showLevels: postType?.hierarchical,
	};
}

export async function ensureView(
	type: string,
	slug?: string,
	search?: { page?: number; search?: string }
) {
	const postTypeObject = await resolveSelect( coreStore ).getPostType( type );
	const defaultView = getDefaultView( postTypeObject );
	return loadView( {
		kind: 'postType',
		name: type,
		slug: 'default-new',
		defaultView,
		activeFilters: getActiveFiltersForTab( slug ?? 'all' ),
		queryParams: search,
	} );
}

export function viewToQuery( view: View, postType: string ) {
	const result: Record< string, any > = {};

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
