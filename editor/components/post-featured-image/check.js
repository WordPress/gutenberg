/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../post-type-support-check';

function PostFeaturedImageCheck( props ) {
	return <PostTypeSupportCheck { ...props } supportKeys="thumbnail" />;
}

export default PostFeaturedImageCheck;
