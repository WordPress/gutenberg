/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useLayoutEffect, useEffect, useRef } from '@wordpress/element';
import { getBlobByURL, isBlobURL, revokeBlobURL } from '@wordpress/blob';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Returns whether the current user can edit the given entity.
 *
 * @param {string} kind     Entity kind.
 * @param {string} name     Entity name.
 * @param {string} recordId Record's id.
 */
export function useCanEditEntity( kind, name, recordId ) {
	return useSelect(
		( select ) =>
			select( coreStore ).canUserEditEntityRecord( kind, name, recordId ),
		[ kind, name, recordId ]
	);
}

/**
 * Handles uploading a media file from a blob URL on mount.
 *
 * @param {Object}   args              Upload media arguments.
 * @param {string}   args.url          Blob URL.
 * @param {?Array}   args.allowedTypes Array of allowed media types.
 * @param {Function} args.onChange     Function called when the media is uploaded.
 * @param {Function} args.onError      Function called when an error happens.
 */
export function useUploadMediaFromBlobURL( args = {} ) {
	const latestArgs = useRef( args );
	const hasUploadStarted = useRef( false );
	const { getSettings } = useSelect( blockEditorStore );

	useLayoutEffect( () => {
		latestArgs.current = args;
	} );

	useEffect( () => {
		// Uploading is a special effect that can't be canceled via the cleanup method.
		// The extra check avoids duplicate uploads in development mode (React.StrictMode).
		if ( hasUploadStarted.current ) {
			return;
		}

		if (
			! latestArgs.current.url ||
			! isBlobURL( latestArgs.current.url )
		) {
			return;
		}

		const file = getBlobByURL( latestArgs.current.url );
		if ( ! file ) {
			return;
		}

		const { url, allowedTypes, onChange, onError } = latestArgs.current;
		const { mediaUpload } = getSettings();

		hasUploadStarted.current = true;

		mediaUpload( {
			filesList: [ file ],
			allowedTypes,
			onFileChange: ( [ media ] ) => {
				if ( isBlobURL( media?.url ) ) {
					return;
				}

				revokeBlobURL( url );
				onChange( media );
				hasUploadStarted.current = false;
			},
			onError: ( message ) => {
				revokeBlobURL( url );
				onError( message );
				hasUploadStarted.current = false;
			},
		} );
	}, [ getSettings ] );
}
