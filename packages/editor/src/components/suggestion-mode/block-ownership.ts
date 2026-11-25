/**
 * Which blocks in the canvas belong to the post being edited.
 *
 * A suggestion is a note on the current post, and its marker has to be saved
 * in that post's content for the save pass and the review UI to find it. The
 * canvas also shows blocks other entities own: a block with controlled inner
 * blocks (a synced pattern, a template part, a navigation menu) saves its
 * children to its own entity, and with the template shown the root blocks are
 * the template's while the post's sit inside Post Content. A marker written
 * into one of those would be stored where nothing processes it, so capture is
 * limited to the post's own blocks and an edit to any other is declined.
 */
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { STORE_NAME } from '../../store/constants';

const BLOCK_EDITOR_STORE_NAME = 'core/block-editor';
const POST_CONTENT_BLOCK_NAME = 'core/post-content';

/**
 * Fixed notice id so a repeated gesture replaces the snackbar instead of
 * stacking one per keystroke.
 */
export const FOREIGN_EDIT_NOTICE_ID =
	'editor/suggestion-mode/foreign-edit-refused';

export type PostOwnershipCheck = {
	/**
	 * Whether a block's attributes are saved in the current post.
	 */
	owns: ( clientId: string ) => boolean;
	/**
	 * Whether the children of a block (or of the root, for a falsy id) are
	 * saved in the current post. Answers for a block that has left the tree,
	 * given the parent it had.
	 */
	ownsChildrenOf: ( parentClientId?: string | null ) => boolean;
};

/**
 * Build an ownership check against the current block tree. The check caches
 * per parent, so build one per pass over the tree and discard it afterwards.
 *
 * A block's own attributes belong to whichever entity holds the block, so a
 * synced pattern block in the post is the post's while its children are the
 * pattern's: ownership follows the nearest ancestor with controlled inner
 * blocks. With no such ancestor the block is in the root tree, which is the
 * post's unless the template is shown.
 *
 * @param registry Data registry.
 * @return The ownership check.
 */
export function createPostOwnershipCheck( registry: any ): PostOwnershipCheck {
	const blockEditor = registry?.select?.( BLOCK_EDITOR_STORE_NAME );
	const isTemplateShown =
		registry?.select?.( STORE_NAME )?.getRenderingMode?.() ===
		'template-locked';
	// The same block the editor treats as the post's container when the
	// template is shown (`getInserter`, the section root).
	const postContentClientId = isTemplateShown
		? blockEditor?.getBlocksByName?.( POST_CONTENT_BLOCK_NAME )?.[ 0 ]
		: undefined;
	const cache = new Map< string, boolean >();

	const ownsChildrenOf = ( parentClientId?: string | null ): boolean => {
		if ( ! parentClientId ) {
			return ! isTemplateShown;
		}
		const cached = cache.get( parentClientId );
		if ( cached !== undefined ) {
			return cached;
		}
		const owned = blockEditor?.areInnerBlocksControlled?.( parentClientId )
			? parentClientId === postContentClientId
			: ownsChildrenOf(
					blockEditor?.getBlockRootClientId?.( parentClientId )
				);
		cache.set( parentClientId, owned );
		return owned;
	};

	return {
		owns: ( clientId ) =>
			ownsChildrenOf( blockEditor?.getBlockRootClientId?.( clientId ) ),
		ownsChildrenOf,
	};
}

/**
 * Whether a block's attributes are saved in the current post.
 *
 * @param registry Data registry.
 * @param clientId Block client id.
 * @return True when the post owns the block.
 */
export function isBlockOwnedByCurrentPost(
	registry: any,
	clientId: string
): boolean {
	return createPostOwnershipCheck( registry ).owns( clientId );
}

/**
 * Tell the user their edit was declined because the block is saved outside
 * the post, where a suggestion cannot follow it.
 *
 * @param registry Data registry.
 */
export function notifyForeignEditRefused( registry: any ) {
	registry
		?.dispatch?.( noticesStore )
		?.createNotice?.(
			'warning',
			__(
				'This block is saved outside this post, so it can’t be changed while suggesting.'
			),
			{
				id: FOREIGN_EDIT_NOTICE_ID,
				type: 'snackbar',
				isDismissible: true,
			}
		);
}
