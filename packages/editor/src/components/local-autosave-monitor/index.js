/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { ifCondition, usePrevious } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { parse } from '@wordpress/blocks';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import AutosaveMonitor from '../autosave-monitor';
import {
	localAutosaveGet,
	localAutosaveClear,
} from '../../store/local-autosave';
import { store as editorStore } from '../../store';

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
	const { postId, isEditedPostNew, hasRemoteAutosave } = useSelect(
		( select ) => ( {
			postId: select( editorStore ).getCurrentPostId(),
			isEditedPostNew: select( editorStore ).isEditedPostNew(),
			hasRemoteAutosave:
				!! select( editorStore ).getEditorSettings().autosave,
		} ),
		[]
	);
	const { getEditedPostAttribute } = useSelect( editorStore );

	const { createWarningNotice, removeNotice } = useDispatch( noticesStore );
	const { editPost, resetEditorBlocks } = useDispatch( editorStore );

	useEffect( () => {
		let localAutosave = localAutosaveGet( postId, isEditedPostNew );
		if ( ! localAutosave ) {
			return;
		}

		try {
			localAutosave = JSON.parse( localAutosave );
		} catch {
			// Not usable if it can't be parsed.
			return;
		}

		const { post_title: title, content, excerpt } = localAutosave;
		const edits = { title, content, excerpt };

		{
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
		}

		if ( hasRemoteAutosave ) {
			return;
		}

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
	}, [ isEditedPostNew, postId ] );
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
