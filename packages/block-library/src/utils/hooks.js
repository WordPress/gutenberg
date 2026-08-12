import { useSelect } from '@wordpress/data';
import { useLayoutEffect, useEffect, useRef } from '@wordpress/element';
import { getBlobByURL, isBlobURL, revokeBlobURL } from '@wordpress/blob';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { useViewportMatch } from '@wordpress/compose';

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
 * @param {Function}      select   Registry `select` function.
 * @param {string}        postType Post type from block context.
 * @param {number|string} postId   Post ID from block context.
 * @return {boolean|undefined} Whether the post can be edited, or `undefined`
 *                             when it can't be determined.
 */
export function canUserEditPostContext( select, postType, postId ) {
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
 * @param {string}        postType Post type from block context.
 * @param {number|string} postId   Post ID from block context.
 * @return {boolean|undefined} Whether the post can be edited, or `undefined`
 *                             when it can't be determined.
 */
export function useCanEditPostContext( postType, postId ) {
	return useSelect(
		( select ) => canUserEditPostContext( select, postType, postId ),
		[ postType, postId ]
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

		const { url, allowedTypes, onChange, onError } = latestArgsRef.current;
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
