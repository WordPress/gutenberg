/**
 * WordPress dependencies
 */
import { dispatch, resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { redirect } from '@wordpress/route';

const USER_POST_TYPE_POST_TYPE = 'wp_user_post_type';
const NEW_ID = 'new';

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
					USER_POST_TYPE_POST_TYPE,
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
			throw redirect( { throw: true, to: '/' } );
		}
	},
	title: async ( { params }: RouteArgs ) => {
		if ( params.id === NEW_ID ) {
			return __( 'Add post type' );
		}
		const id = parseInt( params.id, 10 );
		const record = ( await resolveSelect( coreStore ).getEntityRecord(
			'postType',
			USER_POST_TYPE_POST_TYPE,
			id
		) ) as { title?: { raw?: string; rendered?: string } } | null;
		return (
			record?.title?.raw ?? record?.title?.rendered ?? __( 'Post type' )
		);
	},
};
