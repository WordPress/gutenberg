/**
 * WordPress dependencies
 */
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { menu } from '@wordpress/icons';

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
	status?: string;
	title?: {
		raw?: string;
		rendered?: string;
	};
};

function getNavigationTitle( navigation?: NavigationRecord ) {
	const title = navigation?.title?.rendered || navigation?.title?.raw;
	return title ? decodeEntities( title ) : __( 'Navigation' );
}

function getPreviewStatusLabel( status?: string ) {
	switch ( status ) {
		case 'publish':
			return __( 'Published' );
		case 'future':
			return __( 'Scheduled' );
		case 'draft':
		case 'auto-draft':
			return __( 'Draft' );
		case 'pending':
			return __( 'Pending review' );
		case 'private':
			return __( 'Private' );
		case 'trash':
			return __( 'Trash' );
		default:
			return __( 'Preview' );
	}
}

async function canEditNavigation( navigationId: number ) {
	return !! ( await resolveSelect( coreStore ).canUser( 'update', {
		kind: 'postType',
		name: NAVIGATION_POST_TYPE,
		id: navigationId,
	} ) );
}

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
		const firstNavigation = navigationMenus?.[ 0 ];

		if ( ! firstNavigation ) {
			return {
				postType: NAVIGATION_POST_TYPE,
				isPreview: true,
				previewLabel: __( 'Navigation' ),
				previewIcon: menu,
				previewStatus: 'preview',
				previewStatusLabel: getPreviewStatusLabel( 'preview' ),
				previewEditLabel: __( 'Edit navigation' ),
				previewCanEdit: false,
				previewTone: 'global' as const,
			};
		}

		const postId = search.ids
			? parseInt( search.ids[ 0 ] )
			: firstNavigation.id;
		const navigation =
			navigationMenus?.find( ( item ) => item.id === postId ) ||
			firstNavigation;

		return {
			postType: NAVIGATION_POST_TYPE,
			postId,
			isPreview: true,
			editLink: `/types/wp_navigation/edit/${ postId }`,
			previewLabel: getNavigationTitle( navigation ),
			previewIcon: menu,
			previewStatus: navigation?.status,
			previewStatusLabel: getPreviewStatusLabel( navigation?.status ),
			previewEditLabel: __( 'Edit navigation' ),
			previewCanEdit: await canEditNavigation( postId ),
			previewTone: 'global' as const,
		};
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
