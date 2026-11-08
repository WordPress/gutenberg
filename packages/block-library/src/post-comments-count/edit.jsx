import { useBlockProps } from '@wordpress/block-editor';
import { usePostCommentsCount } from '../utils/hooks';

export default function PostCommentsCountEdit( { context } ) {
	const { postId } = context;
	const { totalItems: commentsCount } = usePostCommentsCount( postId );

	const blockProps = useBlockProps();

	const hasPostAndComments = postId && commentsCount !== null;

	const blockStyles = {
		...blockProps.style,
		textDecoration: hasPostAndComments
			? blockProps.style?.textDecoration
			: undefined,
	};

	return (
		<div { ...blockProps } style={ blockStyles }>
			{ hasPostAndComments ? commentsCount : '0' }
		</div>
	);
}
