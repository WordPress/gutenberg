/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../post-type-support-check';
import ThemeSupportCheck from '../theme-support-check';

function PostFeaturedImageCheck( props ) {
	const { postType } = props;
	return (
		<ThemeSupportCheck supportKeys="post-thumbnails" postType={ postType } >
			<PostTypeSupportCheck { ...props } supportKeys="thumbnail" />
		</ThemeSupportCheck>
	);
}

export default PostFeaturedImageCheck;
