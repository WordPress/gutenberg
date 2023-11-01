/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../post-type-support-check';

function PostExcerptCheck( { children } ) {
	return (
		<PostTypeSupportCheck supportKeys="excerpt">
			{ children }
		</PostTypeSupportCheck>
	);
}

export default PostExcerptCheck;
