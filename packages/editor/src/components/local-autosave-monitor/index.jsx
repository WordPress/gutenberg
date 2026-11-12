import { useCallback, useEffect, useRef } from '@wordpress/element';
import { ifCondition, usePrevious } from '@wordpress/compose';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import AutosaveMonitor from '../autosave-monitor';
import {
	hasSessionStorageSupport,
	localAutosaveClear,
} from '../../store/local-autosave';
import { store as editorStore } from '../../store';

const requestIdleCallback = window.requestIdleCallback
	? window.requestIdleCallback
	: window.requestAnimationFrame;

/**
 * Custom hook which writes a local autosave when the page is hidden or
 * unloaded, so that edits made since the last interval aren't lost.
 */
function useAutosaveOnLeave() {
	const registry = useRegistry();

	useEffect( () => {
		let lastEditsReference;

		// The local autosave is synchronous, so it completes before the
		// page goes away; an idle callback might never run.
		function backup() {
			const editsReference = registry
				.select( coreStore )
				.getReferenceByDistinctEdits();
			if (
				editsReference === lastEditsReference ||
				! registry.select( editorStore ).isEditedPostDirty()
			) {
				return;
			}
			// Record the write only once it succeeds, e.g. within the
			// storage quota.
			registry
				.dispatch( editorStore )
				.autosave( { local: true } )
				.then( () => {
					lastEditsReference = editsReference;
				} );
		}

		function onVisibilityChange() {
			if ( 'hidden' === document.visibilityState ) {
				backup();
			}
		}

		window.addEventListener( 'pagehide', backup );
		document.addEventListener( 'visibilitychange', onVisibilityChange );
		return () => {
			window.removeEventListener( 'pagehide', backup );
			document.removeEventListener(
				'visibilitychange',
				onVisibilityChange
			);
		};
	}, [ registry ] );
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
	useAutosavePurge();
	useAutosaveOnLeave();

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
 * - `useAutosavePurge` hook: Ejects a local autosave after a successful save occurs.
 * - `useAutosaveOnLeave` hook: Writes a local autosave when the page is hidden or unloaded.
 * - `hasSessionStorageSupport` function: Checks if the current environment supports browser sessionStorage.
 * - `LocalAutosaveMonitor` component: Uses the `AutosaveMonitor` component to perform autosaves at a specified interval.
 *
 * The module also checks for sessionStorage support and conditionally exports the `LocalAutosaveMonitor` component based on that.
 *
 * @module LocalAutosaveMonitor
 */
export default ifCondition( hasSessionStorageSupport )( LocalAutosaveMonitor );
