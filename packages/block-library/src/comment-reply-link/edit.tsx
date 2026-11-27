import { _x } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';
import type { BlockEditProps } from '@wordpress/blocks';
import useDeprecatedTextAlign from '../utils/deprecated-text-align-attributes';
import type {
	CommentReplyLinkAttributes,
	CommentReplyLinkBlockContext,
} from './types';

function Edit(
	props: BlockEditProps< CommentReplyLinkAttributes > & {
		context: CommentReplyLinkBlockContext;
	}
) {
	useDeprecatedTextAlign( props );
	const blockProps = useBlockProps();

	return (
		<>
			<div { ...blockProps }>
				<a
					href="#comment-reply-pseudo-link"
					onClick={ ( event ) => event.preventDefault() }
				>
					{
						/* translators: Comment reply button text. */
						_x( 'Reply', 'verb' )
					}
				</a>
			</div>
		</>
	);
}

export default Edit;
