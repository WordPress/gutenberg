/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../post-type-support-check';

function PostFeaturedImageCheck( props ) {
	return <PostTypeSupportCheck { ...props } supportKey="thumbnail" />;
}

export default PostFeaturedImageCheck;
