/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as uploadStore } from '@wordpress/upload-media';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

const LOCK_NAME = 'upload-in-progress';

/**
 * A hook that locks post saving and autosaving while media uploads are in progress.
 * This prevents users from publishing or saving while files are still uploading.
 *
 * Only active when client-side media processing is enabled.
 */
export default function useUploadSaveLock() {
	const isClientSideMediaProcessingEnabled =
		window.__clientSideMediaProcessing;

	const isUploading = useSelect(
		( select ) => {
			if ( ! isClientSideMediaProcessingEnabled ) {
				return false;
			}
			return select( uploadStore ).isUploading();
		},
		[ isClientSideMediaProcessingEnabled ]
	);

	const {
		lockPostSaving,
		unlockPostSaving,
		lockPostAutosaving,
		unlockPostAutosaving,
	} = useDispatch( editorStore );

	useEffect( () => {
		if ( ! isClientSideMediaProcessingEnabled ) {
			return;
		}

		if ( isUploading ) {
			lockPostSaving( LOCK_NAME );
			lockPostAutosaving( LOCK_NAME );
		} else {
			unlockPostSaving( LOCK_NAME );
			unlockPostAutosaving( LOCK_NAME );
		}

		return () => {
			unlockPostSaving( LOCK_NAME );
			unlockPostAutosaving( LOCK_NAME );
		};
	}, [
		isClientSideMediaProcessingEnabled,
		isUploading,
		lockPostSaving,
		unlockPostSaving,
		lockPostAutosaving,
		unlockPostAutosaving,
	] );
}
