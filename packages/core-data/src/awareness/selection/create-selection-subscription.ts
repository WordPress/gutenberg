/**
 * WordPress dependencies
 */
import type { Y } from '@wordpress/sync';

/**
 * Internal dependencies
 */
import { createBlockSelectionSubscription } from './create-block-selection-subscription';
import { createTitleSelectionSubscription } from './create-title-selection-subscription';
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
	const blockSub = createBlockSelectionSubscription(
		doc,
		kind,
		name,
		postId,
		onSelectionChange
	);

	const titleSub = createTitleSelectionSubscription( doc, onSelectionChange );

	return {
		unsubscribe: () => {
			blockSub.unsubscribe();
			titleSub.unsubscribe();
		},
	};
}
