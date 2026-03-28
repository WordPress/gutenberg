/**
 * WordPress dependencies
 */
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { notFound } from '@wordpress/route';

/**
 * Route configuration for post edit.
 */
export const route = {
	beforeLoad: async ( {
		params,
	}: {
		params: {
			type: string;
			id: string;
		};
	} ) => {
		// Try to parse as integer for numeric post IDs
		const numericId = parseInt( params.id, 10 );
		// Use numeric ID if valid, otherwise use string ID (e.g., template part slugs)
		const postId = Number.isNaN( numericId ) ? params.id : numericId;

		try {
			const [ postType, post ] = await Promise.all( [
				resolveSelect( coreStore ).getPostType( params.type ),
				resolveSelect( coreStore ).getEntityRecord(
					'postType',
					params.type,
					postId
				),
			] );

			if ( ! postType || ! post ) {
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
			type: string;
			id: string;
		};
	} ) => {
		// Try to parse as integer for numeric post IDs
		const numericId = parseInt( params.id, 10 );
		// Use numeric ID if valid, otherwise use string ID (e.g., template part slugs)
		const postId = Number.isNaN( numericId ) ? params.id : numericId;

		const post = await resolveSelect( coreStore ).getEntityRecord(
			'postType',
			params.type,
			postId
		);

		if ( ( post as any )?.title?.rendered ) {
			return decodeEntities( ( post as any ).title.rendered );
		}

		const postType = await resolveSelect( coreStore ).getPostType(
			params.type
		);
		return postType?.labels?.edit_item || __( 'Edit' );
	},
	async canvas( context: {
		params: {
			type: string;
			id: string;
		};
	} ) {
		const { params } = context;

		return {
			postType: params.type,
			postId: params.id,
		};
	},
};
