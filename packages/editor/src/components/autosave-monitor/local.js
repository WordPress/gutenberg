/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { ifCondition, usePrevious } from '@wordpress/compose';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { parse } from '@wordpress/blocks';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import {
	localAutosaveGet,
	localAutosaveClear,
} from '../../store/local-autosave';
import { store as editorStore } from '../../store';
import PostTypeSupportCheck from '../post-type-support-check';
import useInterval from './use-interval';

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
 */
function useAutosaveNotice() {
	const registry = useRegistry();
	const { postId, isEditedPostNew } = useSelect(
		( select ) => ( {
			postId: select( editorStore ).getCurrentPostId(),
			isEditedPostNew: select( editorStore ).isEditedPostNew(),
		} ),
		[]
	);

	useEffect( () => {
		const edits = localAutosaveGet( postId, isEditedPostNew );
		if ( ! edits ) {
			return;
		}

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
	}, [ registry, postId, isEditedPostNew ] );
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

function LocalAutosaveMonitorInner() {
	const { autosave } = useDispatch( editorStore );
	const {
		getCurrentPostId,
		isEditedPostNew,
		isEditedPostEmpty,
		isEditedPostDirty,
		isPostAutosavingLocked,
		getEditedPostAttribute,
	} = useSelect( editorStore );
	const { getReferenceByDistinctEdits } = useSelect( coreStore );

	useAutosaveNotice();
	useAutosavePurge();

	const localAutosaveInterval = useSelect(
		( select ) =>
			select( editorStore ).getEditorSettings().localAutosaveInterval,
		[]
	);

	// Reference of the edits last considered for autosaving. Mutable state that
	// must not trigger a re-render, hence a ref.
	const lastEditsReferenceRef = useRef();

	useInterval( () => {
		// A sessionStorage backup only needs saveable content, checked inline
		// because `isEditedPostSaveable()` short-circuits to false during any
		// save, including a remote autosave, which must not block the backup.
		const hasSaveableContent =
			!! getEditedPostAttribute( 'title' ) ||
			!! getEditedPostAttribute( 'excerpt' ) ||
			! isEditedPostEmpty();
		if ( ! hasSaveableContent || isPostAutosavingLocked() ) {
			return;
		}

		const editsReference = getReferenceByDistinctEdits();
		const hasNewEdits = editsReference !== lastEditsReferenceRef.current;
		if ( ! hasNewEdits || ! isEditedPostDirty() ) {
			return;
		}

		// Skip the backup when the edits already match it.
		const backup = localAutosaveGet(
			getCurrentPostId(),
			isEditedPostNew()
		);
		const isBackupCurrent =
			backup &&
			Object.keys( backup ).every(
				( key ) => backup[ key ] === getEditedPostAttribute( key )
			);
		if ( isBackupCurrent ) {
			return;
		}

		// Only consume the edits reference when we save the backup, so edits
		// made in the meantime aren't skipped.
		lastEditsReferenceRef.current = editsReference;
		requestIdleCallback( () => autosave( { local: true } ) );
	}, localAutosaveInterval );

	return null;
}

function LocalAutosaveMonitor() {
	return (
		<PostTypeSupportCheck supportKeys="autosave">
			<LocalAutosaveMonitorInner />
		</PostTypeSupportCheck>
	);
}

/**
 * Monitors local autosaves of a post in the editor.
 * It uses several hooks and functions to manage autosave behavior:
 * - `useAutosaveNotice` hook: Manages the creation of a notice prompting the user to restore a local autosave, if one exists.
 * - `useAutosavePurge` hook: Ejects a local autosave after a successful save occurs.
 * - `hasSessionStorageSupport` function: Checks if the current environment supports browser sessionStorage.
 * - `LocalAutosaveMonitor` component: Saves a sessionStorage backup of the post at the `localAutosaveInterval`.
 *
 * The module also checks for sessionStorage support and conditionally exports the `LocalAutosaveMonitor` component based on that.
 *
 * @module LocalAutosaveMonitor
 */
export default ifCondition( hasSessionStorageSupport )( LocalAutosaveMonitor );
