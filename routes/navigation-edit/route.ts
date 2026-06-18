/**
 * WordPress dependencies
 */
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { notFound } from '@wordpress/route';

/**
 * Internal dependencies
 */
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
		const navigation = await resolveSelect( coreStore ).getEntityRecord(
			'postType',
			NAVIGATION_POST_TYPE,
			navigationId
		);

		if ( navigation?.title?.rendered ) {
			return decodeEntities( navigation.title.rendered );
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
