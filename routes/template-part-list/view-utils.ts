import { loadView } from '@wordpress/views';
import type { View, Filter } from '@wordpress/dataviews';

/**
 * Navigation overlay template part area constant.
 * This should match NAVIGATION_OVERLAY_TEMPLATE_PART_AREA in
 * packages/block-library/src/navigation/constants.js
 */
const NAVIGATION_OVERLAY_TEMPLATE_PART_AREA = 'navigation-overlay';

export const DEFAULT_VIEW: View = {
	type: 'grid' as const,
	sort: {
		field: 'date',
		direction: 'desc' as const,
	},
	fields: [],
	titleField: 'title',
	mediaField: 'preview',
};

export const DEFAULT_VIEWS: {
	slug: string;
	label: string;
}[] = [
	{
		slug: 'all',
		label: 'All Template Parts',
	},
	{
		slug: 'header',
		label: 'Headers',
	},
	{
		slug: 'footer',
		label: 'Footers',
	},
	{
		slug: 'sidebar',
		label: 'Sidebars',
	},
	{
		slug: NAVIGATION_OVERLAY_TEMPLATE_PART_AREA,
		label: 'Overlays',
	},
	{
		slug: 'uncategorized',
		label: 'General',
	},
];

type ActiveViewOverrides = {
	filters?: Filter[];
	sort?: View[ 'sort' ];
};

export function getActiveViewOverridesForTab(
	area: string
): ActiveViewOverrides {
	if ( area === 'all' ) {
		return {};
	}
	return {
		filters: [
			{
				field: 'area',
				operator: 'is',
				value: area,
			},
		],
	};
}

export async function ensureView(
	area?: string,
	search?: { page?: number; search?: string }
) {
	return loadView( {
		kind: 'postType',
		name: 'wp_template_part',
		slug: 'default-new',
		defaultView: DEFAULT_VIEW,
		activeViewOverrides: getActiveViewOverridesForTab( area ?? 'all' ),
		queryParams: search,
	} );
}

export function viewToQuery( view: View ) {
	// The endpoint only supports `area`. Everything else is handled client-side.
	const result: Record< string, any > = { per_page: -1 };

	const areaFilter = view.filters?.find(
		( filter ) => filter.field === 'area'
	);
	if ( areaFilter ) {
		result.area = areaFilter.value;
	}

	return result;
}
