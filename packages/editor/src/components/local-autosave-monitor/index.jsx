import { useCallback, useEffect, useMemo, useRef } from '@wordpress/element';
import { ifCondition, usePrevious } from '@wordpress/compose';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { parse } from '@wordpress/blocks';
import { store as noticesStore } from '@wordpress/notices';
import AutosaveMonitor from '../autosave-monitor';
import {
	localAutosaveGet,
	localAutosaveGetSnapshot,
	localAutosaveClear,
} from '../../store/local-autosave';
import { store as editorStore } from '../../store';
import useEntityContainsSnapshot from '../provider/use-entity-contains-snapshot';

const requestIdleCallback = window.requestIdleCallback
	? window.requestIdleCallback
	: window.requestAnimationFrame;

let hasStorageSupport;

/**
 * Function which returns true if the current environment supports browser
 * sessionStorage, or false otherwise. The result of this function is cached and
 * reused in subsequent invocations.
 */
const hasSessionStorageSupport = () => {
	if ( hasStorageSupport !== undefined ) {
		return hasStorageSupport;
	}

	try {
		// Private Browsing in Safari 10 and earlier will throw an error when
		// attempting to set into sessionStorage. The test here is intentional in
		// causing a thrown error as condition bailing from local autosave.
		window.sessionStorage.setItem( '__wpEditorTestSessionStorage', '' );
		window.sessionStorage.removeItem( '__wpEditorTestSessionStorage' );
		hasStorageSupport = true;
	} catch {
		hasStorageSupport = false;
	}

	return hasStorageSupport;
};

/**
 * Custom hook which manages the creation of a notice prompting the user to
 * restore a local autosave, if one exists.
 *
 * Under real-time collaboration, the backup records a Yjs snapshot of the
 * shared document it captured. The notice decision is deferred until the
 * shared document is checked against that snapshot (see
 * `useEntityContainsSnapshot`): a positive result proves the shared
 * document already accounts for everything the backup captured (even when
 * the post content has since moved on, e.g. after a revision restore), so
 * the backup is redundant and is cleared without a notice.
 */
function useAutosaveNotice() {
	const registry = useRegistry();
	const { postId, postType, isEditedPostNew } = useSelect(
		( select ) => ( {
			postId: select( editorStore ).getCurrentPostId(),
			postType: select( editorStore ).getCurrentPostType(),
			isEditedPostNew: select( editorStore ).isEditedPostNew(),
		} ),
		[]
	);

	// Read and parse the backup once per post, so that its snapshot (if any)
	// can drive the snapshot status decision below.
	const localAutosave = useMemo( () => {
		const backup = localAutosaveGet( postId, isEditedPostNew );
		if ( ! backup ) {
			return null;
		}

		try {
			return JSON.parse( backup );
		} catch {
			// Not usable if it can't be parsed.
			return null;
		}
	}, [ postId, isEditedPostNew ] );

	const snapshotStatus = useEntityContainsSnapshot( {
		postType,
		postId,
		snapshot: localAutosaveGetSnapshot( localAutosave ),
	} );

	useEffect( () => {
		if ( ! localAutosave ) {
			return;
		}

		// Keep waiting for the snapshot status to resolve.
		if ( 'pending' === snapshotStatus ) {
			return;
		}

		if ( 'present' === snapshotStatus ) {
			// The shared document provably holds everything the backup
			// captured, so the backup is redundant even when its content
			// differs from the current post (e.g. after a revision restore).
			localAutosaveClear( postId, isEditedPostNew );
			return;
		}

		const { post_title: title, content, excerpt } = localAutosave;
		const edits = { title, content, excerpt };

		const { getEditedPostAttribute, getEditorSettings } =
			registry.select( editorStore );

		// Only display a notice if there is a difference between what has been
		// saved and that which is stored in sessionStorage.
		const hasDifference = Object.keys( edits ).some( ( key ) => {
			return edits[ key ] !== getEditedPostAttribute( key );
		} );

		if ( ! hasDifference ) {
			// If there is no difference, it can be safely ejected from storage.
			localAutosaveClear( postId, isEditedPostNew );
			return;
		}

		const hasRemoteAutosave = !! getEditorSettings().autosave;
		if ( hasRemoteAutosave ) {
			return;
		}

		const { createWarningNotice, removeNotice } =
			registry.dispatch( noticesStore );
		const { editPost, resetEditorBlocks } =
			registry.dispatch( editorStore );

		const id = 'wpEditorAutosaveRestore';

		createWarningNotice(
			__(
				'The backup of this post in your browser is different from the version below.'
			),
			{
				id,
				actions: [
					{
						label: __( 'Restore the backup' ),
						onClick() {
							const {
								content: editsContent,
								...editsWithoutContent
							} = edits;
							editPost( editsWithoutContent );
							resetEditorBlocks( parse( edits.content ) );
							removeNotice( id );
						},
					},
				],
			}
		);
	}, [ registry, postId, isEditedPostNew, localAutosave, snapshotStatus ] );
}

/**
 * Custom hook which ejects a local autosave after a successful save occurs.
 */
function useAutosavePurge() {
	const { postId, isEditedPostNew, isDirty, isAutosaving, didError } =
		useSelect(
			( select ) => ( {
				postId: select( editorStore ).getCurrentPostId(),
				isEditedPostNew: select( editorStore ).isEditedPostNew(),
				isDirty: select( editorStore ).isEditedPostDirty(),
				isAutosaving: select( editorStore ).isAutosavingPost(),
				didError: select( editorStore ).didPostSaveRequestFail(),
			} ),
			[]
		);

	const lastIsDirtyRef = useRef( isDirty );
	const lastIsAutosavingRef = useRef( isAutosaving );

	useEffect( () => {
		if (
			! didError &&
			( ( lastIsAutosavingRef.current && ! isAutosaving ) ||
				( lastIsDirtyRef.current && ! isDirty ) )
		) {
			localAutosaveClear( postId, isEditedPostNew );
		}

		lastIsDirtyRef.current = isDirty;
		lastIsAutosavingRef.current = isAutosaving;
	}, [ isDirty, isAutosaving, didError ] );

	// Once the isEditedPostNew changes from true to false, let's clear the auto-draft autosave.
	const wasEditedPostNew = usePrevious( isEditedPostNew );
	const prevPostId = usePrevious( postId );
	useEffect( () => {
		if ( prevPostId === postId && wasEditedPostNew && ! isEditedPostNew ) {
			localAutosaveClear( postId, true );
		}
	}, [ isEditedPostNew, postId ] );
}

function LocalAutosaveMonitor() {
	const { autosave } = useDispatch( editorStore );
	const deferredAutosave = useCallback( () => {
		requestIdleCallback( () => autosave( { local: true } ) );
	}, [] );
	useAutosaveNotice();
	useAutosavePurge();

	const localAutosaveInterval = useSelect(
		( select ) =>
			select( editorStore ).getEditorSettings().localAutosaveInterval,
		[]
	);

	return (
		<AutosaveMonitor
			interval={ localAutosaveInterval }
			autosave={ deferredAutosave }
		/>
	);
}

/**
 * Monitors local autosaves of a post in the editor.
 * It uses several hooks and functions to manage autosave behavior:
 * - `useAutosaveNotice` hook: Manages the creation of a notice prompting the user to restore a local autosave, if one exists.
 * - `useAutosavePurge` hook: Ejects a local autosave after a successful save occurs.
 * - `hasSessionStorageSupport` function: Checks if the current environment supports browser sessionStorage.
 * - `LocalAutosaveMonitor` component: Uses the `AutosaveMonitor` component to perform autosaves at a specified interval.
 *
 * The module also checks for sessionStorage support and conditionally exports the `LocalAutosaveMonitor` component based on that.
 *
 * @module LocalAutosaveMonitor
 */
export default ifCondition( hasSessionStorageSupport )( LocalAutosaveMonitor );
