/**
 * WordPress dependencies
 */
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getNavigationMenuCanvas } from '../navigation/route-canvas';

const NAVIGATION_POST_TYPE = 'wp_navigation';
const TEMPLATE_PART_POST_TYPE = 'wp_template_part';

const PRELOADED_NAVIGATION_MENUS_QUERY = {
	per_page: -1,
	status: [ 'publish', 'draft' ],
	order: 'desc',
	orderby: 'date',
};

const PRELOADED_TEMPLATE_PARTS_QUERY = {
	per_page: -1,
};

const PRELOADED_FALLBACK_NAVIGATION_QUERY = {
	per_page: 1,
	orderby: 'date',
	order: 'desc',
	status: 'publish',
	_fields: 'id',
};

type NavigationRecord = {
	id: number;
};

export const route = {
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
		const navigationMenus = ( await resolveSelect(
			coreStore
		).getEntityRecords(
			'postType',
			NAVIGATION_POST_TYPE,
			PRELOADED_NAVIGATION_MENUS_QUERY
		) ) as NavigationRecord[] | undefined;
		const navigationId = search.ids?.[ 0 ]
			? Number( search.ids[ 0 ] )
			: navigationMenus?.[ 0 ]?.id;

		if ( ! navigationId ) {
			return {
				postType: NAVIGATION_POST_TYPE,
				postId: '',
				isPreview: true,
				customCanvas: true,
			};
		}

		return getNavigationMenuCanvas( navigationId );
	},
	loader: async () => {
		await Promise.all( [
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
			// Preload post type object (what usePostFields needs)
			resolveSelect( coreStore ).getPostType( NAVIGATION_POST_TYPE ),
			// Preload users data (what usePostFields needs for author field)
			resolveSelect( coreStore ).getEntityRecords( 'root', 'user', {
				per_page: -1,
			} ),
			// Preload template parts and fallback navigation data used to show
			// whether each navigation menu is active on the site.
			resolveSelect( coreStore ).getEntityRecords(
				'postType',
				TEMPLATE_PART_POST_TYPE,
				PRELOADED_TEMPLATE_PARTS_QUERY
			),
			resolveSelect( coreStore ).getEntityRecords(
				'postType',
				NAVIGATION_POST_TYPE,
				PRELOADED_FALLBACK_NAVIGATION_QUERY
			),
		] );
	},
};
