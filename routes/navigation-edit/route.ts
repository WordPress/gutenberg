import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { notFound } from '@wordpress/route';

const NAVIGATION_POST_TYPE = 'wp_navigation';

/**
 * Whether the Navigation menu editing experiment is on. Its flag is set
 * alongside the block editor script, which loads with the editor assets.
 */
async function isNavigationMenuEditingEnabled() {
	if ( ! ( window as any ).__experimentalNavigationMenuEditing ) {
		const { loadEditorAssets } = await import( '@wordpress/lazy-editor' );
		await loadEditorAssets();
	}

	return !! ( window as any ).__experimentalNavigationMenuEditing;
}

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

		return ( window as any ).__experimentalNavigationMenuEditing
			? __( 'Menu' )
			: __( 'Navigation' );
	},
	canvas: async ( {
		params,
	}: {
		params: {
			id: string;
		};
	} ) => {
		// With the Navigation menu editing experiment on, the canvas shows
		// where the menu is used instead (see `canvas.tsx`).
		if ( await isNavigationMenuEditingEnabled() ) {
			return null;
		}

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
