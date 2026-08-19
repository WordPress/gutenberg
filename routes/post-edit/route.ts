import { dispatch, resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { notFound } from '@wordpress/route';

const TEMPLATE_POST_TYPES = [ 'wp_template', 'wp_template_part' ];

type PostEditParams = {
	type: string;
	'*'?: string;
};

function getPostId( params: PostEditParams ) {
	const id = params[ '*' ];

	if ( ! id ) {
		throw notFound();
	}

	try {
		return decodeURIComponent( id );
	} catch {
		return id;
	}
}

/**
 * Route configuration for post edit.
 */
export const route = {
	beforeLoad: async ( { params }: { params: PostEditParams } ) => {
		const postId = getPostId( params );

		if (
			! TEMPLATE_POST_TYPES.includes( params.type ) &&
			! /^\d+$/.test( postId )
		) {
			throw notFound();
		}

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
	title: async ( { params }: { params: PostEditParams } ) => {
		const postId = getPostId( params );
		const post = await resolveSelect( coreStore ).getEntityRecord(
			'postType',
			params.type,
			postId
		);

		if ( post?.title?.rendered ) {
			return decodeEntities( post.title.rendered );
		}

		const postType = await resolveSelect( coreStore ).getPostType(
			params.type
		);
		return postType?.labels?.edit_item || __( 'Edit' );
	},
	async canvas( context: { params: PostEditParams } ) {
		const { params } = context;
		const postId = getPostId( params );

		return {
			postType: params.type,
			postId,
		};
	},
	async loader( context: {
		params: PostEditParams;
		search: { selectedBlock?: string };
	} ) {
		const { params, search } = context;

		/*
		 * Restore the block the canvas stashed on its way out, so returning to
		 * an entity lands on the block that was selected when it was left. The
		 * record is already resolved by `beforeLoad`, and running here rather
		 * than from the canvas puts the selection in the entity's edits before
		 * the editor provider renders and resets its blocks.
		 */
		if ( search.selectedBlock ) {
			dispatch( coreStore ).editEntityRecord(
				'postType',
				params.type,
				getPostId( params ),
				{
					selection: {
						selectionStart: { clientId: search.selectedBlock },
						selectionEnd: { clientId: search.selectedBlock },
					},
				},
				{ undoIgnore: true }
			);
		}
	},
};
