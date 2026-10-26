/**
 * Client-side abilities for the verbs behind the post actions.
 *
 * Each ability does the work of an action without any UI: it takes JSON input,
 * validated against its `input_schema`, and goes through the core data store,
 * so the lists showing the posts stay in sync. The actions then only bind an
 * ability to the items of a list (see `ability-action.tsx`), and anything that
 * runs abilities, such as the workflow palette or an agent, can use the same
 * verbs.
 */

import {
	getAbility,
	getAbilityCategory,
	registerAbility,
	registerAbilityCategory,
} from '@wordpress/abilities';
import { dispatch, resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import type { CoreDataError } from './types';

export const TRASH_POSTS_ABILITY = 'core/posts/trash';
export const RENAME_POST_ABILITY = 'core/posts/rename';

/*
 * The server registers the same category. Whichever side registers it first
 * wins, so the label and description match the server ones.
 */
const CATEGORY = 'content';

type PostId = number | string;

export interface TrashPostsInput {
	post_type: string;
	ids: PostId[];
}

export interface TrashPostsOutput {
	trashed: PostId[];
	failed: Array< { id: PostId; message: string } >;
}

export interface RenamePostInput {
	post_type: string;
	id: PostId;
	title: string;
}

export interface RenamePostOutput {
	id: PostId;
	title: string;
}

const postIdSchema = {
	type: [ 'integer', 'string' ],
	description: __( 'The id of the post.' ),
};

function getErrorMessage( error: unknown, fallback: string ) {
	const { message, code } = ( error ?? {} ) as CoreDataError;
	return message && code !== 'unknown_error' ? message : fallback;
}

/**
 * Whether the current user can perform a REST action on every given post.
 *
 * @param action   The REST action: `delete` or `update`.
 * @param postType The post type.
 * @param ids      The post ids.
 * @return Whether the user can.
 */
async function canUserOnPosts(
	action: 'delete' | 'update',
	postType: string | undefined,
	ids: PostId[] | undefined
) {
	// Missing input fails the input validation, which runs after this check.
	if ( ! postType || ! Array.isArray( ids ) ) {
		return true;
	}
	const results = await Promise.all(
		ids.map( ( id ) =>
			resolveSelect( coreStore ).canUser( action, {
				kind: 'postType',
				name: postType,
				id,
			} )
		)
	);
	return results.every( Boolean );
}

/**
 * Registers the post abilities, once. Safe to call more than once.
 */
export function registerPostAbilities() {
	if ( ! getAbilityCategory( CATEGORY ) ) {
		registerAbilityCategory( CATEGORY, {
			label: __( 'Content' ),
			description: __(
				'Abilities that retrieve or manage posts and other content.'
			),
		} );
	}

	if ( ! getAbility( TRASH_POSTS_ABILITY ) ) {
		registerAbility( {
			name: TRASH_POSTS_ABILITY,
			label: __( 'Move to trash' ),
			description: __(
				'Moves posts of one post type to the trash. Reports the posts it could not move.'
			),
			category: CATEGORY,
			input_schema: {
				type: 'object',
				properties: {
					post_type: {
						type: 'string',
						description: __( 'The post type of the posts.' ),
					},
					ids: {
						type: 'array',
						items: postIdSchema,
						minItems: 1,
						description: __( 'The ids of the posts to trash.' ),
					},
				},
				required: [ 'post_type', 'ids' ],
				additionalProperties: false,
			},
			output_schema: {
				type: 'object',
				properties: {
					trashed: { type: 'array', items: postIdSchema },
					failed: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								id: postIdSchema,
								message: { type: 'string' },
							},
							required: [ 'id', 'message' ],
						},
					},
				},
				required: [ 'trashed', 'failed' ],
			},
			meta: {
				annotations: { destructive: true, idempotent: false },
			},
			permissionCallback: ( input?: Partial< TrashPostsInput > ) =>
				canUserOnPosts( 'delete', input?.post_type, input?.ids ),
			callback: async ( {
				post_type: postType,
				ids,
			}: TrashPostsInput ): Promise< TrashPostsOutput > => {
				const { deleteEntityRecord } = dispatch( coreStore );
				const results = await Promise.allSettled(
					ids.map( ( id ) =>
						deleteEntityRecord(
							'postType',
							postType,
							id.toString(),
							{},
							{ throwOnError: true }
						)
					)
				);
				const output: TrashPostsOutput = { trashed: [], failed: [] };
				results.forEach( ( result, index ) => {
					if ( result.status === 'fulfilled' ) {
						output.trashed.push( ids[ index ] );
					} else {
						output.failed.push( {
							id: ids[ index ],
							message: getErrorMessage(
								result.reason,
								__(
									'An error occurred while moving the item to the trash.'
								)
							),
						} );
					}
				} );
				return output;
			},
		} );
	}

	if ( ! getAbility( RENAME_POST_ABILITY ) ) {
		registerAbility( {
			name: RENAME_POST_ABILITY,
			label: __( 'Rename' ),
			description: __( 'Changes the title of a post.' ),
			category: CATEGORY,
			input_schema: {
				type: 'object',
				properties: {
					post_type: {
						type: 'string',
						description: __( 'The post type of the post.' ),
					},
					id: postIdSchema,
					title: {
						type: 'string',
						minLength: 1,
						title: __( 'Name' ),
						description: __( 'The new title of the post.' ),
					},
				},
				required: [ 'post_type', 'id', 'title' ],
				additionalProperties: false,
			},
			output_schema: {
				type: 'object',
				properties: {
					id: postIdSchema,
					title: { type: 'string' },
				},
				required: [ 'id', 'title' ],
			},
			meta: {
				annotations: { destructive: false, idempotent: true },
			},
			permissionCallback: ( input?: Partial< RenamePostInput > ) =>
				canUserOnPosts(
					'update',
					input?.post_type,
					input?.id === undefined ? undefined : [ input.id ]
				),
			callback: async ( {
				post_type: postType,
				id,
				title,
			}: RenamePostInput ): Promise< RenamePostOutput > => {
				const { editEntityRecord, saveEditedEntityRecord } =
					dispatch( coreStore );
				await editEntityRecord( 'postType', postType, id, { title } );
				await saveEditedEntityRecord( 'postType', postType, id, {
					throwOnError: true,
				} );
				return { id, title };
			},
		} );
	}
}
