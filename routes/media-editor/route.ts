/**
 * WordPress dependencies
 */
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

export const route = {
	title: async ( {
		params,
	}: {
		params: {
			postId: string;
		};
	} ) => {
		const mediaId = parseInt( params.postId );
		const media = await resolveSelect( coreStore ).getEntityRecord(
			'postType',
			'attachment',
			mediaId
		);

		if ( media?.title?.rendered ) {
			return decodeEntities( media.title.rendered );
		}

		return __( 'Media' );
	},
	loader: async ( {
		params,
	}: {
		params: {
			postId: string;
		};
	} ) => {
		const mediaId = parseInt( params.postId );
		await resolveSelect( coreStore ).getEntityRecord(
			'postType',
			'attachment',
			mediaId
		);
	},
};
