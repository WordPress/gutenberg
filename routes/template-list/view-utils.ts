/**
 * WordPress dependencies
 */
import { loadView } from '@wordpress/views';
import type { View } from '@wordpress/dataviews';

const DEFAULT_VIEW: View = {
	type: 'grid' as const,
	perPage: 20,
	sort: {
		field: 'title',
		direction: 'asc' as const,
	},
	fields: [ 'author', 'active', 'slug' ],
	titleField: 'title',
	descriptionField: 'description',
	mediaField: 'preview',
	filters: [],
};

export const DEFAULT_LAYOUTS = {
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

export function getDefaultView( activeView?: string ): View {
	// User view: sort by date, newest first, include theme field
	if ( activeView === 'user' ) {
		return {
			...DEFAULT_VIEW,
			sort: {
				field: 'date',
				direction: 'desc' as const,
			},
			fields: [ 'author', 'active', 'slug', 'theme' ],
		};
	}

	// Active view: default sorting
	if ( activeView === 'active' || ! activeView ) {
		return {
			...DEFAULT_VIEW,
		};
	}

	// Author-based view: filter by author
	return {
		...DEFAULT_VIEW,
		filters: [
			{
				field: 'author',
				operator: 'isAny',
				value: [ activeView ],
			},
		],
	};
}

export async function ensureView(
	activeView?: string,
	search?: { page?: number; search?: string }
) {
	const defaultView = getDefaultView( activeView );
	return loadView( {
		kind: 'postType',
		name: 'wp_template',
		slug: activeView ?? 'active',
		defaultView,
		queryParams: search,
	} );
}

export function viewToQuery( view: View ) {
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
		result.orderby = view.sort.field;
	}

	if ( undefined !== view.sort?.direction ) {
		result.order = view.sort.direction;
	}

	return result;
}
