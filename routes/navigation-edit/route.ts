import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { notFound } from '@wordpress/route';
import { getNavigationMenuCanvas } from '../navigation/route-canvas';

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
		return getNavigationMenuCanvas( Number( params.id ) );
	},
	loader: async ( {
		params,
	}: {
		params: {
			id: string;
		};
	} ) => {
		const navigationId = parseInt( params.id );
		const resolver = resolveSelect( coreStore );

		await Promise.all( [
			resolver.getEntityRecord(
				'postType',
				NAVIGATION_POST_TYPE,
				navigationId
			),
			// The menu tree edits the wp_navigation entity's blocks directly
			// through `useEntityBlockEditor`, which reads the edited record.
			// Preloading it avoids an empty first render on direct route loads.
			resolver.getEditedEntityRecord(
				'postType',
				NAVIGATION_POST_TYPE,
				navigationId
			),
		] );
	},
};
