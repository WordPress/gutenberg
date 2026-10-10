/**
 * Side effects of the Suggestion mode guard on post-level edits: the refusal
 * announcement, and the wrap of the core-data `editEntityRecord` action that
 * refuses a direct write to the current post while suggesting. The rules
 * themselves are the pure functions in `suggest-post-edits.ts`.
 */
import { __ } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';
import {
	EDITOR_INTENT_SUGGEST,
	STORE_NAME,
	SUGGEST_LOCKED_POST_FIELDS,
} from './constants';
import { classifySuggestedPostEdits } from './suggest-post-edits';
import { unlock } from '../lock-unlock';

/**
 * Announce that a post-level change was refused while suggesting.
 *
 * Said twice over, in two channels: a refusal only screen reader users
 * perceive is indistinguishable from a control that quietly does nothing.
 * `speak` carries the announcement because it fires on every refusal and can
 * be assertive; the snackbar carries the visible half with `speak: false`,
 * since a spoken snackbar would announce the same sentence a second time.
 *
 * @param registry The data registry.
 * @param refused  The refused fields.
 */
export function announceSuggestRefusal( registry: any, refused: string[] ) {
	const isStatus = refused.some( ( field ) =>
		( SUGGEST_LOCKED_POST_FIELDS as readonly string[] ).includes( field )
	);
	const message = isStatus
		? __(
				"The post status can't be changed while suggesting. Switch to Editing to change it."
			)
		: __(
				"This setting can't be changed while suggesting. Switch to Editing to change it."
			);
	speak( message, 'assertive' );
	registry.dispatch( noticesStore ).createNotice( 'info', message, {
		// One notice id per message, so a control that dispatches
		// repeatedly replaces its own snackbar instead of stacking them.
		id: isStatus
			? 'editor-suggest-locked-post-status'
			: 'editor-suggest-locked-post-field',
		type: 'snackbar',
		isDismissible: true,
		speak: false,
	} );
}

/*
 * Writes that must reach the post while suggesting: `editPost` passing on
 * what it already classified, and a reviewer's accept applying a proposal.
 * A depth counter rather than a flag, so a bypassed write that triggers
 * another bypassed write does not end the outer bypass early.
 */
let bypassDepth = 0;

/**
 * Run a callback whose post edits skip the Suggestion mode guard. The guard
 * checks synchronously when `editEntityRecord` is called, so the bypass only
 * covers writes dispatched while the callback runs.
 *
 * @param callback The callback.
 * @return The callback's return value.
 */
export function withoutSuggestPostEditGuard< T >( callback: () => T ): T {
	bypassDepth++;
	try {
		return callback();
	} finally {
		bypassDepth--;
	}
}

const installed = new WeakMap< object, ( ...args: any[] ) => any >();

/**
 * Wrap the core-data `editEntityRecord` action so a direct write to the
 * current post is refused while suggesting.
 *
 * The wrap patches the actions object `registry.dispatch( coreStore )`
 * returns, which `useDispatch` and thunks share, so every caller resolving
 * the action after the patch is covered. It stays installed for the
 * editor's lifetime and checks the intent on every call, rather than
 * installing on entry to Suggesting: a component destructures the action
 * when it renders, and one that rendered before the intent changed would
 * otherwise keep the unguarded original. Installing twice is a no-op.
 *
 * @param registry The data registry.
 * @return Restores the original action.
 */
export function installSuggestPostEditGuard( registry: any ): () => void {
	const coreActions = registry.dispatch( coreStore );
	if ( ! coreActions?.editEntityRecord ) {
		return () => {};
	}
	if ( ! installed.has( coreActions ) ) {
		const original = coreActions.editEntityRecord;
		installed.set( coreActions, original );
		coreActions.editEntityRecord = (
			kind: string,
			name: string,
			recordId: any,
			edits: Record< string, any >,
			options?: Record< string, any >
		) => {
			if ( bypassDepth > 0 || kind !== 'postType' ) {
				return original( kind, name, recordId, edits, options );
			}
			const editor = registry.select( STORE_NAME );
			if (
				unlock( editor ).getEditorIntent() !== EDITOR_INTENT_SUGGEST ||
				name !== editor.getCurrentPostType() ||
				String( recordId ) !== String( editor.getCurrentPostId() )
			) {
				return original( kind, name, recordId, edits, options );
			}
			const record = registry
				.select( coreStore )
				.getEditedEntityRecord( kind, name, recordId );
			const { passthrough, refused } = classifySuggestedPostEdits(
				edits,
				{ getCurrentValue: ( attribute ) => record?.[ attribute ] }
			);
			if ( refused.length ) {
				announceSuggestRefusal( registry, refused );
			}
			if ( ! Object.keys( passthrough ).length ) {
				return Promise.resolve();
			}
			return original( kind, name, recordId, passthrough, options );
		};
	}
	return () => {
		const original = installed.get( coreActions );
		if ( original ) {
			coreActions.editEntityRecord = original;
			installed.delete( coreActions );
		}
	};
}
