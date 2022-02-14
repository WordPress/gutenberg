/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore, useEntityProp } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

function getAvatarSizes( sizes ) {
	const minSize = sizes ? sizes[ 0 ] : 24;
	const maxSize = sizes ? sizes[ sizes.length - 1 ] : 96;
	const maxSizeBuffer = Math.floor( maxSize * 2.5 );
	return {
		minSize,
		maxSize: maxSizeBuffer,
	};
}

function useAvatar( avatarUrls ) {
	const { avatarURL: defaultAvatarUrl } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		const { __experimentalDiscussionSettings } = getSettings();
		return __experimentalDiscussionSettings;
	} );
	return avatarUrls ? avatarUrls[ avatarUrls.length - 1 ] : defaultAvatarUrl;
}

export function useCommentAvatar( { commentId } ) {
	const [ avatars ] = useEntityProp(
		'root',
		'comment',
		'author_avatar_urls',
		commentId
	);

	const [ authorName ] = useEntityProp(
		'root',
		'comment',
		'author_name',
		commentId
	);
	const avatarUrls = avatars ? Object.values( avatars ) : null;
	const sizes = avatars ? Object.keys( avatars ) : null;
	const { minSize, maxSize } = getAvatarSizes( sizes );
	return {
		src: useAvatar( avatarUrls ),
		minSize,
		maxSize,
		// translators: %s is the Author name.
		alt: authorName
			? // translators: %s is the Author name.
			  sprintf( __( '%s Avatar' ), authorName )
			: __( 'Default Avatar' ),
	};
}

export function useUserAvatar( { postId, postType } ) {
	const { authorDetails } = useSelect(
		( select ) => {
			const { getEditedEntityRecord, getUser } = select( coreStore );
			const _authorId = getEditedEntityRecord(
				'postType',
				postType,
				postId
			)?.author;

			return {
				authorDetails: _authorId ? getUser( _authorId ) : null,
			};
		},
		[ postType, postId ]
	);
	const avatarUrls = authorDetails
		? Object.values( authorDetails.avatar_urls )
		: null;
	const sizes = authorDetails
		? Object.keys( authorDetails.avatar_urls )
		: null;
	const { minSize, maxSize } = getAvatarSizes( sizes );
	return {
		src: useAvatar( avatarUrls ),
		minSize,
		maxSize,
		alt: authorDetails
			? // translators: %s is the Author name.
			  sprintf( __( '%s Avatar' ), authorDetails?.name )
			: __( 'Default Avatar' ),
	};
}
