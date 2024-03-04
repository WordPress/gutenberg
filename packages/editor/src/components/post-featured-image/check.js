/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../post-type-support-check';
import ThemeSupportCheck from '../theme-support-check';

function PostFeaturedImageCheck( { children } ) {
	return (
		<ThemeSupportCheck supportKeys="post-thumbnails">
			<PostTypeSupportCheck supportKeys="thumbnail">
				{ children }
			</PostTypeSupportCheck>
		</ThemeSupportCheck>
	);
}

export default PostFeaturedImageCheck;
