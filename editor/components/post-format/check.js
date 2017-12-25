/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../post-type-support-check';

function PostFormatCheck( props ) {
	return <PostTypeSupportCheck { ...props } supportKey="post-formats" />;
}

export default PostFormatCheck;
