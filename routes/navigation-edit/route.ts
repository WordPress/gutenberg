/**
 * WordPress dependencies
 */
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

const NAVIGATION_POST_TYPE = 'wp_navigation';

export const route = {
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
			editLink: `/types/wp_navigation/edit/${ postId }`,
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
