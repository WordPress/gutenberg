import { trash } from '@wordpress/icons';
import { __, _n, sprintf, _x } from '@wordpress/i18n';
import { getItemTitle } from '../../shared/utils';
import { hasActionLink } from '../../shared/has-action-link';
import { createAbilityAction } from '../../shared/ability-action';
import {
	TRASH_POSTS_ABILITY,
	type TrashPostsOutput,
} from '../../shared/abilities';
import type {
	PostWithPermissions,
	ActionScriptParts,
} from '../../shared/types';

const trashPost: ActionScriptParts< PostWithPermissions > = {
	icon: trash,
	isEligible( item ) {
		if ( item.type === 'wp_template_part' || item.type === 'wp_block' ) {
			return false;
		}

		// Non-database template cannot be trashed.
		if ( item.type === 'wp_template' && typeof item.id === 'string' ) {
			return false;
		}

		return (
			!! item.status &&
			! [ 'auto-draft', 'trash' ].includes( item.status ) &&
			item.permissions?.delete &&
			hasActionLink( item, 'wp:action-trash' )
		);
	},
	...createAbilityAction< PostWithPermissions, TrashPostsOutput >( {
		ability: TRASH_POSTS_ABILITY,
		getInput: ( items ) => ( {
			post_type: items[ 0 ].type,
			ids: items.map( ( item ) => item.id ),
		} ),
		getConfirmation: ( items ) =>
			items.length === 1
				? sprintf(
						// translators: %s: The item's title.
						__(
							'Are you sure you want to move "%s" to the trash?'
						),
						getItemTitle( items[ 0 ] )
					)
				: sprintf(
						// translators: %d: The number of items (2 or more).
						_n(
							'Are you sure you want to move %d item to the trash ?',
							'Are you sure you want to move %d items to the trash ?',
							items.length
						),
						items.length
					),
		submitLabel: _x( 'Trash', 'verb' ),
		noticeId: 'move-to-trash-action',
		getSuccessMessage: ( items, { failed } ) => {
			if ( failed.length ) {
				return null;
			}
			return items.length === 1
				? sprintf(
						/* translators: %s: The item's title. */
						__( '"%s" moved to the trash.' ),
						getItemTitle( items[ 0 ] )
					)
				: sprintf(
						/* translators: %d: The number of items. */
						_n(
							'%d item moved to the trash.',
							'%d items moved to the trash.',
							items.length
						),
						items.length
					);
		},
		getErrorMessage: ( items, { failed } ) => {
			if ( ! failed.length ) {
				return null;
			}
			if ( items.length === 1 ) {
				return failed[ 0 ].message;
			}
			const messages = [
				...new Set( failed.map( ( { message } ) => message ) ),
			];
			return messages.length === 1
				? sprintf(
						/* translators: %s: an error message */
						__(
							'An error occurred while moving the item to the trash: %s'
						),
						messages[ 0 ]
					)
				: sprintf(
						/* translators: %s: a list of comma separated error messages */
						__(
							'Some errors occurred while moving the items to the trash: %s'
						),
						messages.join( ',' )
					);
		},
		fallbackErrorMessage: __(
			'An error occurred while moving the items to the trash.'
		),
	} ),
};

/**
 * The JavaScript parts of the trash action for PostWithPermissions; its data is
 * in `action.php`.
 */
export default trashPost;
