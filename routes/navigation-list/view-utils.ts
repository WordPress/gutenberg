/**
 * WordPress dependencies
 */
import { loadView } from '@wordpress/views';
import type { View } from '@wordpress/dataviews';

const NAVIGATION_POST_TYPE = 'wp_navigation';

const DEFAULT_VIEW: View = {
	type: 'list' as const,
	sort: {
		field: 'date',
		direction: 'desc' as const,
	},
	titleField: 'title',
};

export function getDefaultView(): View {
	return DEFAULT_VIEW;
}

export async function ensureView( search?: {
	page?: number;
	search?: string;
} ) {
	const defaultView = getDefaultView();
	return loadView( {
		kind: 'postType',
		name: NAVIGATION_POST_TYPE,
		slug: 'default-new',
		defaultView,
		queryParams: search,
	} );
}
