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
 * Say a refusal twice over, in two channels: a refusal only screen reader
 * users perceive is indistinguishable from a control that quietly does
 * nothing. `speak` carries the announcement because it fires on every
 * refusal and can be assertive; the snackbar carries the visible half with
 * `speak: false`, since a spoken snackbar would announce the same sentence a
 * second time.
 *
 * @param registry The data registry.
 * @param message  The refusal.
 * @param id       The notice id: one per message, so a control that
 *                 dispatches repeatedly replaces its own snackbar instead of
 *                 stacking them.
 */
function announce( registry: any, message: string, id: string ) {
	speak( message, 'assertive' );
	registry.dispatch( noticesStore ).createNotice( 'info', message, {
		id,
		type: 'snackbar',
		isDismissible: true,
		speak: false,
	} );
}

/**
 * Announce that a post-level change was refused while suggesting.
 *
 * @param registry The data registry.
 * @param refused  The refused fields.
 */
export function announceSuggestRefusal( registry: any, refused: string[] ) {
	const isStatus = refused.some( ( field ) =>
		( SUGGEST_LOCKED_POST_FIELDS as readonly string[] ).includes( field )
	);
	if ( isStatus ) {
		announce(
			registry,
			__(
				"The post status can't be changed while suggesting. Switch to Editing to change it."
			),
			'editor-suggest-locked-post-status'
		);
		return;
	}
	announce(
		registry,
		__(
			"This setting can't be changed while suggesting. Switch to Editing to change it."
		),
		'editor-suggest-locked-post-field'
	);
}

/**
 * Why the post cannot be moved to the trash while suggesting: shown as the
 * trash controls' description, and announced when a trash is refused.
 *
 * @return The message.
 */
export function getSuggestTrashRefusalMessage(): string {
	return __(
		"Moving to the trash isn't available while suggesting. Switch to Editing to move it to the trash."
	);
}

/**
 * Announce that moving the post to the trash was refused while suggesting.
 *
 * @param registry The data registry.
 */
export function announceSuggestTrashRefusal( registry: any ) {
	announce(
		registry,
		getSuggestTrashRefusalMessage(),
		'editor-suggest-locked-trash'
	);
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

/** The core-data actions the guard wraps, with their originals. */
type WrappedActions = Record< string, ( ...args: any[] ) => any >;

const installed = new WeakMap< object, WrappedActions >();

/**
 * Whether the editor is suggesting.
 *
 * @param registry The data registry.
 * @return Whether the intent is Suggesting.
 */
function isSuggesting( registry: any ): boolean {
	return (
		unlock( registry.select( STORE_NAME ) ).getEditorIntent() ===
		EDITOR_INTENT_SUGGEST
	);
}

/**
 * Whether a record is the post being edited.
 *
 * @param registry The data registry.
 * @param kind     Entity kind.
 * @param name     Entity name.
 * @param recordId Record id.
 * @return Whether it is the current post.
 */
function isCurrentPost(
	registry: any,
	kind: string,
	name: string,
	recordId: any
): boolean {
	const editor = registry.select( STORE_NAME );
	return (
		kind === 'postType' &&
		name === editor.getCurrentPostType() &&
		String( recordId ) === String( editor.getCurrentPostId() )
	);
}

/**
 * Wrap the core-data actions that can change the post without passing
 * through `editPost`, so a direct write is refused while suggesting:
 *
 *   - `editEntityRecord` on the current post keeps content edits and refuses
 *     the rest.
 *   - `deleteEntityRecord` on the current post (the actions menu's "Trash")
 *     is refused.
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
 * @return Restores the original actions.
 */
export function installSuggestPostEditGuard( registry: any ): () => void {
	const coreActions = registry.dispatch( coreStore );
	if ( ! coreActions?.editEntityRecord ) {
		return () => {};
	}
	if ( ! installed.has( coreActions ) ) {
		const originals: WrappedActions = {
			editEntityRecord: coreActions.editEntityRecord,
			deleteEntityRecord: coreActions.deleteEntityRecord,
		};
		installed.set( coreActions, originals );
		const isGuarded = () => bypassDepth === 0 && isSuggesting( registry );

		coreActions.editEntityRecord = (
			kind: string,
			name: string,
			recordId: any,
			edits: Record< string, any >,
			options?: Record< string, any >
		) => {
			const original = originals.editEntityRecord;
			if ( ! isGuarded() ) {
				return original( kind, name, recordId, edits, options );
			}
			if ( ! isCurrentPost( registry, kind, name, recordId ) ) {
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

		if ( originals.deleteEntityRecord ) {
			coreActions.deleteEntityRecord = (
				kind: string,
				name: string,
				recordId: any,
				...args: any[]
			) => {
				if (
					isGuarded() &&
					isCurrentPost( registry, kind, name, recordId )
				) {
					announceSuggestTrashRefusal( registry );
					return Promise.resolve();
				}
				return originals.deleteEntityRecord(
					kind,
					name,
					recordId,
					...args
				);
			};
		}
	}
	return () => {
		const originals = installed.get( coreActions );
		if ( originals ) {
			for ( const [ action, original ] of Object.entries( originals ) ) {
				if ( original ) {
					coreActions[ action ] = original;
				}
			}
			installed.delete( coreActions );
		}
	};
}
