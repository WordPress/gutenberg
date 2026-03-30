/**
 * WordPress dependencies
 */
import type { View, Filter } from '@wordpress/dataviews';

export const DEFAULT_VIEW: View = {
	type: 'table' as const,
	sort: {
		field: 'date',
		direction: 'desc' as const,
	},
	fields: [ 'author_name', 'content', 'post', 'date' ],
	titleField: 'author_name',
	descriptionField: 'content',
	perPage: 20,
};

export const DEFAULT_LAYOUTS = {
	table: {},
	list: {},
};

type ActiveViewOverrides = {
	filters?: Filter[];
	layout?: Record< string, unknown >;
};

export function getActiveViewOverridesForTab(
	slug: string
): ActiveViewOverrides {
	if ( slug === 'all' ) {
		return {};
	}
	return {
		filters: [
			{
				field: 'status',
				operator: 'is',
				value: slug,
			},
		],
	};
}

/**
 * Convert a DataViews view object to WP REST API query parameters
 * for the /wp/v2/comments endpoint.
 *
 * @param view The current DataViews view state.
 */
export function viewToQuery( view: View ) {
	const result: Record< string, any > = {};

	// Pagination
	if ( view.perPage !== undefined ) {
		result.per_page = view.perPage;
	}
	if ( view.page !== undefined ) {
		result.page = view.page;
	}

	// Search
	if ( view.search ) {
		result.search = view.search;
	}

	// Sorting
	if ( view.sort?.field ) {
		result.orderby = view.sort.field;
	}
	if ( view.sort?.direction ) {
		result.order = view.sort.direction;
	}

	// Filters
	const statusFilter = view.filters?.find(
		( filter ) => filter.field === 'status'
	);
	if ( statusFilter ) {
		result.status = statusFilter.value;
	}
	// When no status filter is set (the "All" tab), omit the status param.
	// The REST API defaults to approved comments for authenticated users.

	const postFilter = view.filters?.find(
		( filter ) => filter.field === 'post'
	);
	if ( postFilter ) {
		result.post = postFilter.value;
	}

	const dateFilter = view.filters?.find(
		( filter ) => filter.field === 'date'
	);
	if ( dateFilter?.value ) {
		if ( dateFilter.operator === 'before' ) {
			result.before = dateFilter.value;
		} else if ( dateFilter.operator === 'after' ) {
			result.after = dateFilter.value;
		}
	}

	return result;
}
