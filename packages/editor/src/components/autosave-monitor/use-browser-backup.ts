import { useEffect } from '@wordpress/element';
import { useRegistry, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '../../store';
import {
	hasSessionStorageSupport,
	localAutosaveClear,
} from '../../store/local-autosave';

function requestIdleCallback( callback: () => void ) {
	if ( window.requestIdleCallback ) {
		window.requestIdleCallback( callback );
	} else {
		window.requestAnimationFrame( callback );
	}
}

/**
 * Keeps a backup of the edited post in the browser's `sessionStorage`.
 *
 * The backup is written every `localAutosaveInterval` seconds, and when the
 * page is hidden or unloaded, whenever the post has edits not yet backed up.
 * A save clears the backups written before it started.
 */
export default function useBrowserBackup() {
	const registry = useRegistry();
	const interval = useSelect(
		( select ) =>
			(
				select( editorStore ).getEditorSettings() as {
					localAutosaveInterval?: number;
				}
			 ).localAutosaveInterval,
		[]
	);

	useEffect( () => {
		if ( ! hasSessionStorageSupport() ) {
			return;
		}

		let lastEditsReference: unknown;
		let lastIsNew: boolean | undefined;

		function write() {
			const {
				isEditedPostDirty,
				isEditedPostNew,
				isPostAutosavingLocked,
			} = registry.select( editorStore );
			const editsReference = registry
				.select( coreStore )
				.getReferenceByDistinctEdits();
			const isNew = isEditedPostNew();
			// The first save moves the backup from the `auto-draft` key to
			// the post ID, so the same edits are written again there.
			if (
				( editsReference === lastEditsReference &&
					isNew === lastIsNew ) ||
				! isEditedPostDirty() ||
				isPostAutosavingLocked()
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
					lastIsNew = isNew;
				} );
		}

		// Writing on leave is synchronous, so it completes before the page
		// goes away; an idle callback might never run.
		function onVisibilityChange() {
			if ( 'hidden' === document.visibilityState ) {
				write();
			}
		}

		const intervalId = interval
			? setInterval( () => requestIdleCallback( write ), interval * 1000 )
			: undefined;
		window.addEventListener( 'pagehide', write );
		document.addEventListener( 'visibilitychange', onVisibilityChange );
		return () => {
			clearInterval( intervalId );
			window.removeEventListener( 'pagehide', write );
			document.removeEventListener(
				'visibilitychange',
				onVisibilityChange
			);
		};
	}, [ registry, interval ] );

	useEffect( () => {
		if ( ! hasSessionStorageSupport() ) {
			return;
		}

		const {
			isSavingPost,
			isEditedPostDirty,
			isEditedPostNew,
			getCurrentPostId,
			didPostSaveRequestFail,
		} = registry.select( editorStore );
		let wasSaving = isSavingPost();
		let wasDirty = isEditedPostDirty();
		let wasNew = isEditedPostNew();
		let lastPostId = getCurrentPostId();
		// Mounted during a save, only backups written since are known to be
		// newer than it.
		let saveStartTime = wasSaving ? Date.now() : undefined;

		return registry.subscribe( () => {
			const isSaving = isSavingPost();
			const isDirty = isEditedPostDirty();
			const isNew = isEditedPostNew();
			const postId = getCurrentPostId();
			if ( isSaving && ! wasSaving ) {
				saveStartTime = Date.now();
			}

			if (
				postId !== null &&
				postId === lastPostId &&
				! didPostSaveRequestFail()
			) {
				const hasSaved = wasSaving && ! isSaving;
				// A backup written after the save started can hold edits the
				// save missed, so it is kept.
				const time = hasSaved ? saveStartTime : undefined;
				if ( hasSaved || ( wasDirty && ! isDirty ) ) {
					localAutosaveClear( postId, isNew, time );
				}
				// Once saved, a new post is backed up under its ID, so any
				// backup under the shared `auto-draft` key is stale.
				if ( wasNew && ! isNew ) {
					localAutosaveClear( postId, true );
				}
			}

			wasSaving = isSaving;
			wasDirty = isDirty;
			wasNew = isNew;
			lastPostId = postId;
		} );
	}, [ registry ] );
}
