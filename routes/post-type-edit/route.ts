/**
 * WordPress dependencies
 */
import {
	NEW_ID,
	POST_TYPE_ENTITY,
	POST_TYPES_PATH,
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
					POST_TYPE_ENTITY,
					id
				);
			} catch {
				// Fall through to the redirect below.
			}
		}
		if ( ! record ) {
			dispatch( noticesStore ).createErrorNotice(
				__( 'Post type not found.' ),
				{ type: 'snackbar' }
			);
			throw redirect( { throw: true, to: POST_TYPES_PATH } );
		}
	},
	title: async ( { params }: RouteArgs ) => {
		if ( params.id === NEW_ID ) {
			return __( 'Add post type' );
		}
		const id = parseInt( params.id, 10 );
		const record = ( await resolveSelect( coreStore ).getEntityRecord(
			'postType',
			POST_TYPE_ENTITY,
			id
		) ) as { title?: { raw?: string; rendered?: string } } | null;
		return (
			record?.title?.raw ?? record?.title?.rendered ?? __( 'Post type' )
		);
	},
};
