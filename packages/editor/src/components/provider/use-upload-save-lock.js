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
 * Only active when the experimental media processing feature is enabled.
 */
export default function useUploadSaveLock() {
	const isExperimentEnabled = window.__experimentalMediaProcessing;

	const isUploading = useSelect(
		( select ) => {
			if ( ! isExperimentEnabled ) {
				return false;
			}
			return select( uploadStore ).isUploading();
		},
		[ isExperimentEnabled ]
	);

	const {
		lockPostSaving,
		unlockPostSaving,
		lockPostAutosaving,
		unlockPostAutosaving,
	} = useDispatch( editorStore );

	useEffect( () => {
		if ( ! isExperimentEnabled ) {
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
		isExperimentEnabled,
		isUploading,
		lockPostSaving,
		unlockPostSaving,
		lockPostAutosaving,
		unlockPostAutosaving,
	] );
}
