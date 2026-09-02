import { trash } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';
import { __, _x, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import type { Action } from '@wordpress/dataviews';
import { getItemTitle } from './utils';
import { canTrash, trashItems } from './trash-items';
import type { CoreDataError, PostWithPermissions } from '../types';

/**
 * Restores a draft that was just moved to the trash.
 *
 * @param item     The trashed draft.
 * @param registry The data registry.
 */
async function restoreDraft( item: PostWithPermissions, registry: any ) {
	const { createSuccessNotice, createErrorNotice } =
		registry.dispatch( noticesStore );
	try {
		await registry
			.dispatch( coreStore )
			.saveEntityRecord(
				'postType',
				item.type,
				{ id: item.id, status: 'draft' },
				{ throwOnError: true }
			);
		createSuccessNotice(
			sprintf(
				/* translators: %s: The item's title. */
				__( '"%s" has been restored.' ),
				getItemTitle( item )
			),
			{ type: 'snackbar', id: 'restore-post-action' }
		);
	} catch ( error ) {
		const typedError = error as CoreDataError;
		createErrorNotice(
			typedError?.message ||
				__( 'An error occurred while restoring the post.' ),
			{ type: 'snackbar' }
		);
	}
}

const trashDraft: Action< PostWithPermissions > = {
	id: 'move-draft-to-trash',
	label: _x( 'Trash', 'verb' ),
	isPrimary: true,
	icon: trash,
	// Trashing a draft is not destructive enough to require a confirmation:
	// nothing published changes and the draft can be restored from the trash.
	// The post editor, where this action is not listed, keeps confirming.
	context: 'list',
	isEligible( item ) {
		return item.status === 'draft' && canTrash( item );
	},
	async callback( items, { registry, onActionPerformed } ) {
		await trashItems( items, {
			registry,
			onActionPerformed,
			successNoticeOptions: {
				actions: [
					{
						label: __( 'Undo' ),
						onClick: () => restoreDraft( items[ 0 ], registry ),
					},
				],
			},
		} );
	},
};

/**
 * Trash action for drafts: moves the draft to the trash without asking for
 * confirmation and offers to undo it from the notice.
 */
export default trashDraft;
