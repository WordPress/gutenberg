/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../post-type-support-check';

function PostExcerptCheck( props ) {
	return <PostTypeSupportCheck { ...props } supportKey="excerpt" />;
}

export default PostExcerptCheck;
