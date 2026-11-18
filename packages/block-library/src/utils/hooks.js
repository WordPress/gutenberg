import { useSelect } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { getBlobByURL, isBlobURL, revokeBlobURL } from '@wordpress/blob';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import { useEvent, useViewportMatch } from '@wordpress/compose';

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
 * Returns the comments query of a post: `totalItems` is its comment count once
 * known, and stays null when the request fails.
 *
 * @param {number} postId Post ID. Nothing is fetched without one.
 */
export function usePostCommentsCount( postId ) {
	// The view context lets users who can't moderate comments read the count.
	return useEntityRecords(
		'root',
		'comment',
		{ post: postId, per_page: 1, _fields: 'id', context: 'view' },
		{ enabled: !! postId }
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
	const hasUploadStartedRef = useRef( false );
	const { getSettings } = useSelect( blockEditorStore );
	// The upload ends renders later, so call the latest callbacks.
	const onChange = useEvent( args.onChange );
	const onError = useEvent( args.onError );

	const startUpload = useEvent( () => {
		// Uploading is a special effect that can't be canceled via the cleanup method.
		// The extra check avoids duplicate uploads in development mode (React.StrictMode).
		if ( hasUploadStartedRef.current ) {
			return;
		}
		if ( ! args.url || ! isBlobURL( args.url ) ) {
			return;
		}

		const file = getBlobByURL( args.url );
		if ( ! file ) {
			return;
		}

		const { url, allowedTypes } = args;
		const { mediaUpload } = getSettings();

		if ( ! mediaUpload ) {
			return;
		}

		hasUploadStartedRef.current = true;

		mediaUpload( {
			filesList: [ file ],
			allowedTypes,
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
	} );

	useEffect( () => {
		startUpload();
	}, [ startUpload ] );
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
