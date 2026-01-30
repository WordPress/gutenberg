/**
 * WordPress dependencies
 */
import { loadView } from '@wordpress/views';
import type { View, Filter } from '@wordpress/dataviews';

export const DEFAULT_VIEW: View = {
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

export const DEFAULT_VIEW_LEGACY: View = {
	...DEFAULT_VIEW,
	fields: [ 'author' ],
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

export function getActiveFiltersForTab( activeView: string ): Filter[] {
	if ( activeView === 'active' || activeView === 'user' ) {
		return [];
	}
	// Author-based view
	return [
		{
			field: 'author',
			operator: 'isAny',
			value: [ activeView ],
		},
	];
}

export async function ensureView(
	activeView?: string,
	search?: { page?: number; search?: string }
) {
	return loadView( {
		kind: 'postType',
		name: 'wp_template',
		slug: 'default-new',
		defaultView: DEFAULT_VIEW,
		activeFilters: getActiveFiltersForTab( activeView ?? 'active' ),
		queryParams: search,
	} );
}

export function getActiveFiltersForTabLegacy( activeView: string ): Filter[] {
	if ( activeView === 'all' ) {
		return [];
	}
	// Author-based view
	return [
		{
			field: 'author',
			operator: 'isAny',
			value: [ activeView ],
		},
	];
}

export async function ensureViewLegacy(
	activeView?: string,
	search?: { page?: number; search?: string }
) {
	return loadView( {
		kind: 'postType',
		name: 'wp_template',
		slug: 'default-new',
		defaultView: DEFAULT_VIEW_LEGACY,
		activeFilters: getActiveFiltersForTabLegacy( activeView ?? 'all' ),
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
