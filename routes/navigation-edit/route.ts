/**
 * WordPress dependencies
 */
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { notFound } from '@wordpress/route';

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
	canvas: async () => {
		// Return null to use custom canvas from canvas.tsx
		return null;
	},
	loader: async ( {
		params,
	}: {
		params: {
			id: string;
		};
	} ) => {
		const navigationId = parseInt( params.id );
		await Promise.all( [
			// Preload the navigation menu
			resolveSelect( coreStore ).getEntityRecord(
				'postType',
				NAVIGATION_POST_TYPE,
				navigationId
			),
			// Preload template parts for the canvas grid
			resolveSelect( coreStore ).getEntityRecords(
				'postType',
				'wp_template_part',
				{ per_page: -1 }
			),
			// Preload fallback navigation menu for "used in" detection
			resolveSelect( coreStore ).getEntityRecords(
				'postType',
				'wp_navigation',
				{
					per_page: 1,
					orderby: 'date',
					order: 'desc',
					status: 'publish',
					_fields: 'id',
				}
			),
		] );
	},
};
