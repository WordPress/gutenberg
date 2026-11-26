import { useSelect } from '@wordpress/data';
import type { SelectFunction } from '@wordpress/data';
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
 * Returns whether the current user can edit the post referenced by a block's
 * `postId`/`postType` context, reporting `false` only when the reference
 * could be positively checked.
 *
 * The `postId` and `postType` context values can come from different
 * providers (e.g. a block providing only `postId`, with `postType` coming
 * from the editor root), so the pair may not designate an existing post. The
 * REST permission check then reports every action as disallowed even when the
 * user can edit the actual post, so a plain `canUser( 'update' )` gate would
 * produce false negatives. Only a post that is confirmed readable under
 * `postType` yet not updatable is reported as non-editable; any state that
 * can't be determined (still resolving, or no readable post behind the pair)
 * is `undefined`.
 *
 * Both `canUser` calls resolve from a single OPTIONS request.
 *
 * @param select   Registry `select` function.
 * @param postType Post type from block context.
 * @param postId   Post ID from block context.
 * @return Whether the post can be edited, or `undefined` when it can't be
 *         determined.
 */
export function canUserEditPostContext(
	select: SelectFunction,
	postType: string | undefined,
	postId: number | string | undefined
): boolean | undefined {
	if ( ! postType || ! postId ) {
		return undefined;
	}
	const resource = { kind: 'postType', name: postType, id: postId };
	const canRead = select( coreStore ).canUser( 'read', resource );
	if ( canRead !== true ) {
		return undefined;
	}
	return select( coreStore ).canUser( 'update', resource );
}

/**
 * Hook version of `canUserEditPostContext`.
 *
 * @param postType Post type from block context.
 * @param postId   Post ID from block context.
 * @return Whether the post can be edited, or `undefined` when it can't be
 *         determined.
 */
export function useCanEditPostContext(
	postType: string | undefined,
	postId: number | string | undefined
): boolean | undefined {
	return useSelect(
		( select ) => canUserEditPostContext( select, postType, postId ),
		[ postType, postId ]
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
