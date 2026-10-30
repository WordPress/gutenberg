import { useBlockProps } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { __, sprintf, _n } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { usePostCommentsCount } from '../utils/hooks';

function PostCommentsLinkEdit( { context } ) {
	const { postType, postId } = context;
	const { totalItems: commentsCount } = usePostCommentsCount( postId );

	const blockProps = useBlockProps();

	const post = useSelect(
		( select ) =>
			select( coreStore ).getEditedEntityRecord(
				'postType',
				postType,
				postId
			),
		[ postType, postId ]
	);

	let commentsText;
	if ( commentsCount !== null ) {
		const commentsNumber = parseInt( commentsCount );

		if ( commentsNumber === 0 ) {
			commentsText = __( 'No comments' );
		} else {
			commentsText = sprintf(
				/* translators: %s: Number of comments */
				_n( '%s comment', '%s comments', commentsNumber ),
				commentsNumber.toLocaleString()
			);
		}
	}

	return (
		<div { ...blockProps }>
			{ post?.link && commentsText !== undefined ? (
				<a
					href={ post?.link + '#comments' }
					onClick={ ( event ) => event.preventDefault() }
				>
					{ commentsText }
				</a>
			) : (
				<a
					href="#post-comments-link-pseudo-link"
					onClick={ ( event ) => event.preventDefault() }
				>
					{ __( 'No comments' ) }
				</a>
			) }
		</div>
	);
}

export default PostCommentsLinkEdit;
