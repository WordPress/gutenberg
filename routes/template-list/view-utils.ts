import { loadView } from '@wordpress/views';
import type { View, Filter } from '@wordpress/dataviews';

export const DEFAULT_VIEW: View = {
	type: 'grid' as const,
	perPage: 20,
	sort: {
		field: 'title',
		direction: 'asc' as const,
	},
	fields: [ 'author' ],
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

type ActiveViewOverrides = {
	filters?: Filter[];
	sort?: View[ 'sort' ];
};

export function getActiveViewOverridesForTab(
	activeView: string
): ActiveViewOverrides {
	if ( activeView === 'all' ) {
		return {};
	}
	// Author-based view. Mirrors the per-author views the v1 view config
	// endpoint provides: the filter is locked so the tab can't be removed
	// from the filter bar.
	return {
		filters: [
			{
				field: 'author',
				operator: 'is',
				value: activeView,
				isLocked: true,
			},
		],
	};
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
		activeViewOverrides: getActiveViewOverridesForTab(
			activeView ?? 'all'
		),
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
