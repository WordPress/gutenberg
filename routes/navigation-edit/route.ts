import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { notFound, redirect } from '@wordpress/route';

const NAVIGATION_POST_TYPE = 'wp_navigation';

export const route = {
	beforeLoad: async ( {
		params,
	}: {
		params: {
			id: string;
		};
	} ) => {
		const navigationId = parseInt( params.id, 10 );

		if ( Number.isNaN( navigationId ) ) {
			throw notFound();
		}

		// Only block themes render `wp_navigation` posts. Classic themes manage
		// their menus through Appearance > Menus instead.
		const theme = await resolveSelect( coreStore ).getCurrentTheme();
		if ( ! theme?.is_block_theme ) {
			throw notFound();
		}

		// Opening the Site Editor doesn't imply managing Navigation Menus. The
		// REST API only reports the post type's `create_posts` capability for
		// the collection, so that capability gates the screen. The list route
		// explains why the user can't manage menus.
		const canManageNavigationMenus = await resolveSelect(
			coreStore
		).canUser( 'create', {
			kind: 'postType',
			name: NAVIGATION_POST_TYPE,
		} );
		if ( ! canManageNavigationMenus ) {
			throw redirect( { to: '/navigation/list' } );
		}

		try {
			const navigation = await resolveSelect( coreStore ).getEntityRecord(
				'postType',
				NAVIGATION_POST_TYPE,
				navigationId
			);

			if ( ! navigation ) {
				throw notFound();
			}
		} catch {
			throw notFound();
		}
	},
	title: async ( {
		params,
	}: {
		params: {
			id: string;
		};
	} ) => {
		const navigationId = parseInt( params.id );
		const navigation = ( await resolveSelect( coreStore ).getEntityRecord(
			'postType',
			NAVIGATION_POST_TYPE,
			navigationId
		) ) as { title?: { rendered?: string; raw?: string } } | undefined;

		if ( navigation?.title?.rendered ) {
			return decodeEntities( navigation.title.rendered );
		}

		// A record received from a save carries no rendered fields, only raw
		// ones — that's what the cache holds for a menu created this session.
		if ( navigation?.title?.raw ) {
			return navigation.title.raw;
		}

		return __( 'Navigation' );
	},
	canvas: async ( {
		params,
	}: {
		params: {
			id: string;
		};
	} ) => {
		const postId = parseInt( params.id );
		return {
			postType: NAVIGATION_POST_TYPE,
			postId,
			isPreview: true,
		};
	},
	loader: async ( {
		params,
	}: {
		params: {
			id: string;
		};
	} ) => {
		const navigationId = parseInt( params.id );
		await resolveSelect( coreStore ).getEntityRecord(
			'postType',
			NAVIGATION_POST_TYPE,
			navigationId
		);
	},
};
