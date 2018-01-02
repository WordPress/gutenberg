/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../post-type-support-check';

function PostFormatCheck( props ) {
	return <PostTypeSupportCheck { ...props } supportKeys="post-formats" />;
}

export default PostFormatCheck;
