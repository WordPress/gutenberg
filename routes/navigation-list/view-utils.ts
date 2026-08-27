import { loadView } from '@wordpress/views';
import {
	loadEntityViewConfig,
	getActiveViewOverrides,
} from '@wordpress/routes-view-config';

const NAVIGATION_POST_TYPE = 'wp_navigation';

export async function ensureView( search?: {
	page?: number;
	search?: string;
} ) {
	const {
		default_view: defaultView,
		default_layouts: defaultLayouts,
		view_list: viewList,
	} = await loadEntityViewConfig( 'postType', NAVIGATION_POST_TYPE );
	if ( ! defaultView ) {
		throw new Error(
			`Missing view configuration for the ${ NAVIGATION_POST_TYPE } post type.`
		);
	}
	return loadView( {
		kind: 'postType',
		name: NAVIGATION_POST_TYPE,
		slug: 'default-new',
		defaultView,
		defaultLayouts,
		activeViewOverrides: getActiveViewOverrides( viewList, 'all' ),
		queryParams: search,
	} );
}
