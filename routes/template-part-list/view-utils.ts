/**
 * WordPress dependencies
 */
import { loadView } from '@wordpress/views';
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { Type } from '@wordpress/core-data';
import type { View } from '@wordpress/dataviews';

const DEFAULT_VIEW: View = {
	type: 'grid' as const,
	sort: {
		field: 'date',
		direction: 'desc' as const,
	},
	fields: [],
	titleField: 'title',
	mediaField: 'preview',
};

export const DEFAULT_LAYOUTS = {
	table: {},
	grid: {},
	list: {},
};

export const DEFAULT_VIEWS: {
	slug: string;
	label: string;
	view: View;
}[] = [
	{
		slug: 'all',
		label: 'All Template Parts',
		view: {
			...DEFAULT_VIEW,
		},
	},
	{
		slug: 'header',
		label: 'Headers',
		view: {
			...DEFAULT_VIEW,
			filters: [
				{
					field: 'area',
					operator: 'is',
					value: 'header',
				},
			],
		},
	},
	{
		slug: 'footer',
		label: 'Footers',
		view: {
			...DEFAULT_VIEW,
			filters: [
				{
					field: 'area',
					operator: 'is',
					value: 'footer',
				},
			],
		},
	},
	{
		slug: 'sidebar',
		label: 'Sidebars',
		view: {
			...DEFAULT_VIEW,
			filters: [
				{
					field: 'area',
					operator: 'is',
					value: 'sidebar',
				},
			],
		},
	},
	{
		slug: 'uncategorized',
		label: 'General',
		view: {
			...DEFAULT_VIEW,
			filters: [
				{
					field: 'area',
					operator: 'is',
					value: 'uncategorized',
				},
			],
		},
	},
];

export function getDefaultView(
	postType: Type | undefined,
	area?: string
): View {
	// Find the view configuration by area
	const viewConfig = DEFAULT_VIEWS.find( ( v ) => v.slug === area );

	// Use the view from the config if found, otherwise use default
	return viewConfig?.view || DEFAULT_VIEW;
}

export async function ensureView(
	area?: string,
	search?: { page?: number; search?: string }
) {
	const postTypeObject =
		await resolveSelect( coreStore ).getPostType( 'wp_template_part' );
	const defaultView = getDefaultView( postTypeObject, area );
	return loadView( {
		kind: 'postType',
		name: 'wp_template_part',
		slug: area ?? 'all',
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

	// Area filtering for template parts
	const areaFilter = view.filters?.find(
		( filter ) => filter.field === 'area'
	);
	if ( areaFilter ) {
		result.area = areaFilter.value;
	}

	return result;
}
