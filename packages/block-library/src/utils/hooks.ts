import { useSelect } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { getBlobByURL, isBlobURL, revokeBlobURL } from '@wordpress/blob';
import { store as blockEditorStore } from '@wordpress/block-editor';
import type { MediaUploadFunction } from '@wordpress/block-editor';
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import { useEvent, useViewportMatch } from '@wordpress/compose';
import type { UploadMediaFromBlobURLArgs } from './types';

/**
 * Returns whether the current user can edit the given entity.
 *
 * @param kind     Entity kind.
 * @param name     Entity name.
 * @param recordId Record's id.
 */
export function useCanEditEntity(
	kind: string,
	name: string,
	recordId: string | number
) {
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
 * @param postId Post ID. Nothing is fetched without one.
 */
export function usePostCommentsCount(
	postId: number | undefined
): ReturnType< typeof useEntityRecords< { id: number } > > {
	// The view context lets users who can't moderate comments read the count.
	return useEntityRecords< { id: number } >(
		'root',
		'comment',
		{ post: postId, per_page: 1, _fields: 'id', context: 'view' },
		{ enabled: !! postId }
	);
}

/**
 * Handles uploading a media file from a blob URL on mount.
 *
 * @param args Upload media arguments.
 */
export function useUploadMediaFromBlobURL(
	args: UploadMediaFromBlobURLArgs = {}
): void {
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
		const { mediaUpload } = getSettings() as {
			mediaUpload?: MediaUploadFunction;
		};

		if ( ! mediaUpload ) {
			return;
		}

		hasUploadStartedRef.current = true;

		mediaUpload( {
			filesList: [ file ],
			allowedTypes,
			onFileChange: ( [ media ] ) => {
				if ( isBlobURL( media?.url as string | undefined ) ) {
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
		const { __experimentalDiscussionSettings } = getSettings() as {
			__experimentalDiscussionSettings?: { avatarURL?: string };
		};
		return __experimentalDiscussionSettings?.avatarURL ?? '';
	}, [] );
	return avatarURL;
}

export function useToolsPanelDropdownMenuProps() {
	const isMobile = useViewportMatch( 'medium', '<' );
	return ! isMobile
		? {
				popoverProps: {
					placement: 'left-start' as const,
					// For non-mobile, inner sidebar width (248px) - button width (24px) - border (1px) + padding (16px) + spacing (20px)
					offset: 259,
				},
			}
		: {};
}
