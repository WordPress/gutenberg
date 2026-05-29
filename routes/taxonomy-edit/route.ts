/**
 * WordPress dependencies
 */
import {
	NEW_ID,
	TAXONOMIES_PATH,
	TAXONOMY_ENTITY,
} from '@wordpress/content-types';
import { dispatch, resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { redirect } from '@wordpress/route';

type RouteArgs = { params: { id: string } };

export const route = {
	beforeLoad: async ( { params }: RouteArgs ) => {
		if ( params.id === NEW_ID ) {
			return;
		}
		const id = parseInt( params.id, 10 );
		let record;
		if ( ! Number.isNaN( id ) ) {
			try {
				record = await resolveSelect( coreStore ).getEntityRecord(
					'postType',
					TAXONOMY_ENTITY,
					id
				);
			} catch {
				// Fall through to the redirect below.
			}
		}
		if ( ! record ) {
			dispatch( noticesStore ).createErrorNotice(
				__( 'Taxonomy not found.' ),
				{ type: 'snackbar' }
			);
			throw redirect( { throw: true, to: TAXONOMIES_PATH } );
		}
	},
	title: async ( { params }: RouteArgs ) => {
		if ( params.id === NEW_ID ) {
			return __( 'Add taxonomy' );
		}
		const id = parseInt( params.id, 10 );
		const record = ( await resolveSelect( coreStore ).getEntityRecord(
			'postType',
			TAXONOMY_ENTITY,
			id
		) ) as { title?: { raw?: string; rendered?: string } } | null;
		return (
			record?.title?.raw ?? record?.title?.rendered ?? __( 'Taxonomy' )
		);
	},
};
