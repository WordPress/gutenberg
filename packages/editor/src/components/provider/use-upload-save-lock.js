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
 * When the durable upload queue is enabled (the default), saving mid-upload is
 * safe and deliberately allowed: the block serializes a durable `uploadId`
 * marker, and an interrupted upload is offered for resume on the next editor
 * load. The hard lock only applies when durable persistence is opted out of.
 */
export default function useUploadSaveLock() {
	const shouldLock = useSelect(
		( select ) =>
			select( uploadStore ).isUploading() &&
			select( uploadStore ).getSettings().durableQueue === false,
		[]
	);

	const {
		lockPostSaving,
		unlockPostSaving,
		lockPostAutosaving,
		unlockPostAutosaving,
	} = useDispatch( editorStore );

	useEffect( () => {
		if ( shouldLock ) {
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
		shouldLock,
		lockPostSaving,
		unlockPostSaving,
		lockPostAutosaving,
		unlockPostAutosaving,
	] );
}
