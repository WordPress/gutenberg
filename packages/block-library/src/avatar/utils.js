/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';

export function getCommentAvatar( {
	functionUseEntityProp,
	functionUseSelect,
	commentId,
} ) {
	const [ avatars ] = functionUseEntityProp(
		'root',
		'comment',
		'author_avatar_urls',
		commentId
	);

	const [ authorName ] = functionUseEntityProp(
		'root',
		'comment',
		'author_name',
		commentId
	);
	const avatarUrls = avatars ? Object.values( avatars ) : null;
	const sizes = avatars ? Object.keys( avatars ) : null;
	const minSize = sizes ? sizes[ 0 ] : 24;
	const maxSize = sizes ? sizes[ sizes.length - 1 ] : 96;
	const maxSizeBuffer = Math.floor( maxSize * 2.5 );
	const { avatarURL: defaultAvatarUrl } = functionUseSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		const { __experimentalDiscussionSettings } = getSettings();
		return __experimentalDiscussionSettings;
	} );
	return {
		src: avatarUrls
			? avatarUrls[ avatarUrls.length - 1 ]
			: defaultAvatarUrl,
		minSize,
		maxSize: maxSizeBuffer,
		// translators: %s is the Author name.
		alt: sprintf( __( '%s Avatar' ), authorName ),
	};
}

export function getUserAvatar( { postId, postType, functionUseSelect } ) {
	const { authorDetails } = functionUseSelect(
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
	const minSize = sizes ? sizes[ 0 ] : 24;
	const maxSize = sizes ? sizes[ sizes.length - 1 ] : 96;
	const maxSizeBuffer = Math.floor( maxSize * 2.5 );
	const { avatarURL: defaultAvatarUrl } = functionUseSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		const { __experimentalDiscussionSettings } = getSettings();
		return __experimentalDiscussionSettings;
	} );
	return {
		src: avatarUrls
			? avatarUrls[ avatarUrls.length - 1 ]
			: defaultAvatarUrl,
		minSize,
		maxSize: maxSizeBuffer,

		alt: authorDetails
			? // translators: %s is the Author name.
			  sprintf( __( '%s Avatar' ), authorDetails?.name )
			: __( 'Default Avatar' ),
	};
}
