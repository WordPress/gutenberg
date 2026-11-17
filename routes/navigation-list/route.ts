import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { notFound } from '@wordpress/route';
import { loadNavigationViewConfig } from './view-utils';

const NAVIGATION_POST_TYPE = 'wp_navigation';

const PRELOADED_NAVIGATION_MENUS_QUERY = {
	per_page: -1,
	status: [ 'publish', 'draft' ],
	order: 'desc',
	orderby: 'date',
};

/**
 * Opening the Site Editor doesn't imply managing Navigation Menus. The REST
 * API only reports the post type's `create_posts` capability for the
 * collection, so that capability gates the screen, as it does the Navigation
 * menu item on the server.
 */
async function canManageNavigationMenus() {
	return !! ( await resolveSelect( coreStore ).canUser( 'create', {
		kind: 'postType',
		name: NAVIGATION_POST_TYPE,
	} ) );
}

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
		// The stage explains why there are no menus to show, without a canvas.
		if ( ! ( await canManageNavigationMenus() ) ) {
			return undefined;
		}

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
		// The menus query includes drafts, which the REST API only returns to
		// users who can edit Navigation Menus.
		if ( ! ( await canManageNavigationMenus() ) ) {
			return;
		}

		await Promise.all( [
			// Preload the view configuration the stage resolves its view from.
			loadNavigationViewConfig(),
			// Preload navigation menus
			resolveSelect( coreStore ).getEntityRecords(
				'postType',
				NAVIGATION_POST_TYPE,
				PRELOADED_NAVIGATION_MENUS_QUERY
			),
			// Preload post type object (what usePostFields needs)
			resolveSelect( coreStore ).getPostType( NAVIGATION_POST_TYPE ),
			// Preload users data (what usePostFields needs for author field)
			resolveSelect( coreStore ).getEntityRecords( 'root', 'user', {
				per_page: -1,
			} ),
		] );
	},
};
