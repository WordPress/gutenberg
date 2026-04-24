/**
 * WordPress dependencies
 */
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { notFound } from '@wordpress/route';

const USER_TAXONOMY_POST_TYPE = 'wp_user_taxonomy';
const NEW_ID = 'new';

type RouteArgs = { params: { id: string } };

export const route = {
	beforeLoad: async ( { params }: RouteArgs ) => {
		if ( params.id === NEW_ID ) {
			return;
		}
		const id = parseInt( params.id, 10 );
		if ( Number.isNaN( id ) ) {
			throw notFound();
		}
		try {
			const record = await resolveSelect( coreStore ).getEntityRecord(
				'postType',
				USER_TAXONOMY_POST_TYPE,
				id
			);
			if ( ! record ) {
				throw notFound();
			}
		} catch {
			throw notFound();
		}
	},
	title: async ( { params }: RouteArgs ) => {
		if ( params.id === NEW_ID ) {
			return __( 'Add taxonomy' );
		}
		const id = parseInt( params.id, 10 );
		const record = ( await resolveSelect( coreStore ).getEntityRecord(
			'postType',
			USER_TAXONOMY_POST_TYPE,
			id
		) ) as { title?: { raw?: string; rendered?: string } } | null;
		return (
			record?.title?.raw ?? record?.title?.rendered ?? __( 'Taxonomy' )
		);
	},
	loader: async ( { params }: RouteArgs ) => {
		if ( params.id === NEW_ID ) {
			return;
		}
		const id = parseInt( params.id, 10 );
		if ( Number.isNaN( id ) ) {
			return;
		}
		await resolveSelect( coreStore ).getEntityRecord(
			'postType',
			USER_TAXONOMY_POST_TYPE,
			id
		);
	},
};
