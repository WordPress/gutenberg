/**
 * WordPress dependencies
 */
import { useSelect, useRegistry } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as uploadStore } from '@wordpress/upload-media';

const LOCK_NAME = 'upload-in-progress';

/**
 * A hook that locks post saving and autosaving while media uploads are in progress.
 * This prevents users from publishing or saving while files are still uploading.
 *
 * Note: This hook dynamically accesses the editor store to avoid creating a
 * circular dependency between block-editor and editor packages. The lock
 * functionality only activates when the editor store is available.
 */
export default function useUploadSaveLock() {
	const registry = useRegistry();

	const { isUploading, hasEditorStore } = useSelect( ( select ) => {
		// Check if the editor store is registered to avoid errors
		// in contexts where it's not available (e.g., standalone block editor).
		const stores = registry.stores;
		const editorStoreExists = !! stores[ 'core/editor' ];

		return {
			isUploading: select( uploadStore ).isUploading(),
			hasEditorStore: editorStoreExists,
		};
	}, [] );

	useEffect( () => {
		if ( ! hasEditorStore ) {
			return;
		}

		const { dispatch } = registry;
		const editorDispatch = dispatch( 'core/editor' );

		if ( isUploading ) {
			editorDispatch.lockPostSaving( LOCK_NAME );
			editorDispatch.lockPostAutosaving( LOCK_NAME );
		} else {
			editorDispatch.unlockPostSaving( LOCK_NAME );
			editorDispatch.unlockPostAutosaving( LOCK_NAME );
		}
	}, [ isUploading, hasEditorStore, registry ] );
}
