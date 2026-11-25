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

/** Core-data actions by name. */
type WrappedActions = Record< string, ( ...args: any[] ) => any >;

/** The guard's state for one core-data actions object. */
interface Installation {
	/** The actions as they were before the guard wrapped them. */
	originals: WrappedActions;
	/** The guard's wraps, to tell them from a wrap added later. */
	wrappers: WrappedActions;
	/** The registries of the mounted editors. */
	registries: Set< any >;
}

/*
 * Keyed by the actions object, which editors in sub-registries share: each
 * has its own `core/editor`, and all of them resolve the parent's core-data.
 */
const installed = new WeakMap< object, Installation >();

/**
 * Whether the editor is suggesting.
 *
 * @param registry The data registry.
 * @return Whether the intent is Suggesting.
 */
function isSuggesting( registry: any ): boolean {
	// An editor store registered from the plain store config has no private
	// selectors, and so no intent.
	return (
		unlock( registry.select( STORE_NAME ) ).getEditorIntent?.() ===
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
 * Whether a record holds site settings rather than the post: the site
 * entity itself, or the posts page, whose title the template summary edits
 * as the blog title. A suggestion is about the post, so these can never be
 * proposed.
 *
 * @param registry The data registry.
 * @param kind     Entity kind.
 * @param name     Entity name.
 * @param recordId Record id.
 * @return Whether it is a site settings record.
 */
function isSiteSettingsRecord(
	registry: any,
	kind: string,
	name: string,
	recordId: any
): boolean {
	if ( kind === 'root' && name === 'site' ) {
		return true;
	}
	if ( kind !== 'postType' || name !== 'page' ) {
		return false;
	}
	const postsPageId = registry
		.select( coreStore )
		.getEntityRecord( 'root', 'site' )?.page_for_posts;
	return (
		!! postsPageId &&
		String( recordId ) === String( postsPageId ) &&
		! isCurrentPost( registry, kind, name, recordId )
	);
}

/**
 * Wrap the core-data actions that can change the post, or the site settings
 * shown beside it, without passing through `editPost`, so a direct write is
 * refused while suggesting:
 *
 *   - `editEntityRecord` on the current post keeps content edits and refuses
 *     the rest; on the site settings it is refused outright.
 *   - `saveEntityRecord` and `saveEditedEntityRecord` on the site settings
 *     are refused, so a site setting staged in Editing is not saved from
 *     Suggesting either.
 *   - `deleteEntityRecord` on the current post (the actions menu's "Trash")
 *     is refused.
 *
 * The wrap patches the actions object `registry.dispatch( coreStore )`
 * returns, which `useDispatch` and thunks share, so every caller resolving
 * the action after the patch is covered. It stays installed for the
 * editor's lifetime and checks the intent on every call, rather than
 * installing on entry to Suggesting: a component destructures the action
 * when it renders, and one that rendered before the intent changed would
 * otherwise keep the unguarded original.
 *
 * Editors in sub-registries share the actions object, and a call does not
 * say which editor made it. So the object is wrapped once, every mounted
 * editor is asked on each call, and the originals come back when the last
 * one leaves: a post is guarded while its own editor is suggesting, and the
 * site settings while any editor is. Installing twice for one registry is a
 * no-op.
 *
 * @param registry The data registry.
 * @return Removes this editor from the guard.
 */
export function installSuggestPostEditGuard( registry: any ): () => void {
	const coreActions = registry.dispatch( coreStore );
	if ( ! coreActions?.editEntityRecord ) {
		return () => {};
	}
	let installation = installed.get( coreActions );
	if ( ! installation ) {
		const originals: WrappedActions = {
			editEntityRecord: coreActions.editEntityRecord,
			saveEntityRecord: coreActions.saveEntityRecord,
			saveEditedEntityRecord: coreActions.saveEditedEntityRecord,
			deleteEntityRecord: coreActions.deleteEntityRecord,
		};
		const wrappers: WrappedActions = {};
		const registries = new Set< any >();
		installation = { originals, wrappers, registries };
		installed.set( coreActions, installation );

		/*
		 * The first suggesting editor a record matches, if the guard is not
		 * bypassed.
		 */
		const findSuggestingEditor = (
			matches: ( editorRegistry: any ) => boolean
		) => {
			if ( bypassDepth > 0 ) {
				return undefined;
			}
			for ( const editorRegistry of registries ) {
				if (
					isSuggesting( editorRegistry ) &&
					matches( editorRegistry )
				) {
					return editorRegistry;
				}
			}
			return undefined;
		};

		wrappers.editEntityRecord = (
			kind: string,
			name: string,
			recordId: any,
			edits: Record< string, any >,
			options?: Record< string, any >
		) => {
			const original = originals.editEntityRecord;
			const siteEditor = findSuggestingEditor( ( editorRegistry ) =>
				isSiteSettingsRecord( editorRegistry, kind, name, recordId )
			);
			if ( siteEditor ) {
				announceSuggestRefusal(
					siteEditor,
					Object.keys( edits ?? {} )
				);
				return Promise.resolve();
			}
			const postEditor = findSuggestingEditor( ( editorRegistry ) =>
				isCurrentPost( editorRegistry, kind, name, recordId )
			);
			if ( ! postEditor ) {
				return original( kind, name, recordId, edits, options );
			}
			const record = postEditor
				.select( coreStore )
				.getEditedEntityRecord( kind, name, recordId );
			const { passthrough, refused } = classifySuggestedPostEdits(
				edits,
				{ getCurrentValue: ( attribute ) => record?.[ attribute ] }
			);
			if ( refused.length ) {
				announceSuggestRefusal( postEditor, refused );
			}
			if ( ! Object.keys( passthrough ).length ) {
				return Promise.resolve();
			}
			return original( kind, name, recordId, passthrough, options );
		};

		for ( const action of [
			'saveEntityRecord',
			'saveEditedEntityRecord',
		] as const ) {
			if ( ! originals[ action ] ) {
				continue;
			}
			wrappers[ action ] = (
				kind: string,
				name: string,
				...args: any[]
			) => {
				// `saveEntityRecord` takes the record, `saveEditedEntityRecord`
				// its id; the site entity has no id either way.
				const recordId =
					action === 'saveEntityRecord' ? args[ 0 ]?.id : args[ 0 ];
				const siteEditor = findSuggestingEditor( ( editorRegistry ) =>
					isSiteSettingsRecord( editorRegistry, kind, name, recordId )
				);
				if ( siteEditor ) {
					announceSuggestRefusal( siteEditor, [ name ] );
					return Promise.resolve();
				}
				return originals[ action ]( kind, name, ...args );
			};
		}

		if ( originals.deleteEntityRecord ) {
			wrappers.deleteEntityRecord = (
				kind: string,
				name: string,
				recordId: any,
				...args: any[]
			) => {
				const postEditor = findSuggestingEditor( ( editorRegistry ) =>
					isCurrentPost( editorRegistry, kind, name, recordId )
				);
				if ( postEditor ) {
					announceSuggestTrashRefusal( postEditor );
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

		Object.assign( coreActions, wrappers );
	}

	const { originals, wrappers, registries } = installation;
	registries.add( registry );
	return () => {
		registries.delete( registry );
		if (
			registries.size ||
			installed.get( coreActions ) !== installation
		) {
			return;
		}
		/*
		 * Put back only what is still the guard's own wrap. One wrapped again
		 * since stays: restoring over it would drop the later wrap, and with
		 * no editor left the guard inside it passes every call through.
		 */
		for ( const [ action, wrapper ] of Object.entries( wrappers ) ) {
			if ( coreActions[ action ] === wrapper ) {
				coreActions[ action ] = originals[ action ];
			}
		}
		installed.delete( coreActions );
	};
}
