/**
 * External dependencies
 */
import { v4 as uuidv4 } from 'uuid';

/**
 * WordPress dependencies
 */
import { useSelect, useRegistry } from '@wordpress/data';
import { store as uploadStore } from '@wordpress/upload-media';
import { useLayoutEffect, useEffect, useRef } from '@wordpress/element';
import { getBlobByURL, isBlobURL, revokeBlobURL } from '@wordpress/blob';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

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
			select( coreStore ).canUser( 'update', {
				kind,
				name,
				id: recordId,
			} ),
		[ kind, name, recordId ]
	);
}

/**
 * Handles uploading a media file from a blob URL on mount.
 *
 * @param {Object}    args               Upload media arguments.
 * @param {string}    args.url           Blob URL.
 * @param {?Array}    args.allowedTypes  Array of allowed media types.
 * @param {Function}  args.onChange      Function called when the media is uploaded.
 * @param {Function}  args.onError       Function called when an error happens.
 * @param {?string}   args.uploadId      Durable upload identifier. When omitted a new one is generated.
 * @param {?Function} args.onUploadStart Function called with the resolved upload id when the upload starts.
 */
export function useUploadMediaFromBlobURL( args = {} ) {
	const latestArgsRef = useRef( args );
	const hasUploadStartedRef = useRef( false );
	const { getSettings } = useSelect( blockEditorStore );

	useLayoutEffect( () => {
		latestArgsRef.current = args;
	} );

	useEffect( () => {
		// Uploading is a special effect that can't be canceled via the cleanup method.
		// The extra check avoids duplicate uploads in development mode (React.StrictMode).
		if ( hasUploadStartedRef.current ) {
			return;
		}
		if (
			! latestArgsRef.current.url ||
			! isBlobURL( latestArgsRef.current.url )
		) {
			return;
		}

		const file = getBlobByURL( latestArgsRef.current.url );
		if ( ! file ) {
			return;
		}

		const {
			url,
			allowedTypes,
			onChange,
			onError,
			uploadId,
			onUploadStart,
		} = latestArgsRef.current;
		const { mediaUpload } = getSettings();

		if ( ! mediaUpload ) {
			return;
		}

		hasUploadStartedRef.current = true;

		// Derive a durable upload identifier and notify the block so it can
		// persist the marker to its attributes before the upload begins.
		const resolvedUploadId = uploadId || uuidv4();
		onUploadStart?.( resolvedUploadId );

		mediaUpload( {
			filesList: [ file ],
			allowedTypes,
			uploadId: resolvedUploadId,
			onFileChange: ( [ media ] ) => {
				if ( isBlobURL( media?.url ) ) {
					return;
				}

				revokeBlobURL( url );
				onChange( media );
				hasUploadStartedRef.current = false;
			},
			onError: ( message ) => {
				revokeBlobURL( url );
				onError( message );
				hasUploadStartedRef.current = false;
			},
		} );
	}, [ getSettings ] );
}

export function useDefaultAvatar() {
	const avatarURL = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		const { __experimentalDiscussionSettings } = getSettings();
		return __experimentalDiscussionSettings?.avatarURL ?? '';
	}, [] );
	return avatarURL;
}

export function useToolsPanelDropdownMenuProps() {
	const isMobile = useViewportMatch( 'medium', '<' );
	return ! isMobile
		? {
				popoverProps: {
					placement: 'left-start',
					// For non-mobile, inner sidebar width (248px) - button width (24px) - border (1px) + padding (16px) + spacing (20px)
					offset: 259,
				},
		  }
		: {};
}

/**
 * Reconnects a block to an upload that was interrupted and is awaiting resume.
 *
 * When the block's durable `uploadId` matches a persisted (PendingResume) queue
 * item, the block's callbacks are registered so the resumed upload routes its
 * result back to the block. Returns a recreated preview URL while the resumed
 * upload is pending, or undefined when there is no matching item.
 *
 * @param {Object}    options
 * @param {?string}   options.uploadId Durable marker stored in block attributes.
 * @param {Function}  options.onChange Called with the attachment when available.
 * @param {?Function} options.onError  Called when the upload fails.
 * @return {string|undefined} A recreated preview blob URL, if available.
 */
export function useResumeUploadFromMarker( { uploadId, onChange, onError } ) {
	const registry = useRegistry();

	const item = useSelect(
		( select ) =>
			uploadId
				? unlock( select( uploadStore ) ).getItemByUploadId( uploadId )
				: undefined,
		[ uploadId ]
	);

	useEffect( () => {
		if ( ! uploadId || ! item ) {
			return;
		}
		unlock( registry.dispatch( uploadStore ) ).registerItemCallbacks(
			uploadId,
			{
				onChange: ( attachments ) => onChange?.( attachments?.[ 0 ] ),
				onError,
			}
		);
	}, [ uploadId, item, onChange, onError, registry ] );

	return item?.attachment?.url;
}
