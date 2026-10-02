import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { loadFields } from '@wordpress/fields-loader';
import { notFound } from '@wordpress/route';
import { loadNavigationViewConfig } from './view-utils';

const NAVIGATION_POST_TYPE = 'wp_navigation';

const PRELOADED_NAVIGATION_MENUS_QUERY = {
	per_page: -1,
	status: [ 'publish', 'draft' ],
	order: 'desc',
	orderby: 'date',
};

export const route = {
	async beforeLoad() {
		// Only block themes render `wp_navigation` posts. Classic themes manage
		// their menus through Appearance > Menus instead.
		const theme = await resolveSelect( coreStore ).getCurrentTheme();
		if ( ! theme?.is_block_theme ) {
			throw notFound();
		}
	},
	title: () => __( 'Navigation' ),
	canvas: async ( {
		search,
	}: {
		search: {
			ids?: string[];
			page?: number;
			search?: string;
		};
	} ) => {
		const navigations = ( await resolveSelect( coreStore ).getEntityRecords(
			'postType',
			NAVIGATION_POST_TYPE,
			PRELOADED_NAVIGATION_MENUS_QUERY
		) ) as { id: number }[] | null;
		const firstNavigation = navigations?.[ 0 ];

		if ( ! firstNavigation ) {
			return { postType: NAVIGATION_POST_TYPE, isPreview: true };
		}

		const postId = search.ids
			? parseInt( search.ids[ 0 ] )
			: firstNavigation.id;

		return {
			postType: NAVIGATION_POST_TYPE,
			postId,
			isPreview: true,
		};
	},
	loader: async () => {
		await Promise.all( [
			// Preload the view configuration the stage resolves its view from.
			loadNavigationViewConfig(),
			// Preload navigation menus
			resolveSelect( coreStore ).getEntityRecords(
				'postType',
				NAVIGATION_POST_TYPE,
				PRELOADED_NAVIGATION_MENUS_QUERY
			),
			resolveSelect( coreStore ).canUser( 'create', {
				kind: 'postType',
				name: NAVIGATION_POST_TYPE,
			} ),
			// Preload the post type object, which the actions need.
			resolveSelect( coreStore ).getPostType( NAVIGATION_POST_TYPE ),
			// Warm up the fields the stage renders. `useFields` there shares
			// this resolution, so the screen paints with its fields on first
			// render. A failure is the stage's to report, so it does not
			// block the route.
			loadFields( {
				kind: 'postType',
				name: NAVIGATION_POST_TYPE,
			} ).catch( () => {} ),
			// Preload the users, which the author field's control needs.
			resolveSelect( coreStore ).getEntityRecords( 'root', 'user', {
				per_page: -1,
			} ),
		] );
	},
};
