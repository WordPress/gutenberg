/**
 * WordPress dependencies
 */
import type { Y } from '@wordpress/sync';

/**
 * Internal dependencies
 */
import { createBlockSelectionSubscription } from './create-block-selection-subscription';
import { createTitleSelectionSubscription } from './create-title-selection-subscription';
import { SelectionType } from '../../types';
import type { SelectionState } from '../../types';

/**
 * Creates a combined subscription that observes both block and title selection
 * changes and forwards the latest SelectionState to a single callback.
 *
 * @param doc               - The Yjs document.
 * @param kind              - Entity kind (e.g. 'postType').
 * @param name              - Entity name (e.g. 'post').
 * @param postId            - The post ID.
 * @param onSelectionChange - Single callback for any selection change.
 * @return An object with an unsubscribe method to tear down both subscriptions.
 */
export function createSelectionSubscription(
	doc: Y.Doc,
	kind: string,
	name: string,
	postId: number,
	onSelectionChange: ( selectionState: SelectionState ) => void
): { unsubscribe: () => void } {
	// Coordinates the two sources so that a block "none" event (which fires
	// when the block editor clears its selection) does not overwrite an active
	// title selection. When clicking from a block into the title, the sequence
	// is: title fires -> block clears to "none". Without this guard the
	// trailing "none" would clobber the title cursor.
	let titleIsActive = false;

	const blockSub = createBlockSelectionSubscription(
		doc,
		kind,
		name,
		postId,
		( selectionState ) => {
			if ( selectionState.type === SelectionType.None && titleIsActive ) {
				// The block editor cleared its selection after the title
				// became active. Ignore this so the title cursor persists.
				return;
			}

			titleIsActive = false;
			onSelectionChange( selectionState );
		}
	);

	const titleSub = createTitleSelectionSubscription(
		doc,
		( selectionState ) => {
			titleIsActive = true;
			onSelectionChange( selectionState );
		}
	);

	return {
		unsubscribe: () => {
			blockSub.unsubscribe();
			titleSub.unsubscribe();
		},
	};
}
