/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../post-type-support-check';
import ThemeSupportCheck from '../theme-support-check';

/**
 * Wrapper component that renders its children only if the post type supports a featured image
 * and the theme supports post thumbnails.
 *
 * @param {Object}          props          Props.
 * @param {React.ReactNode} props.children Children to be rendered.
 *
 * @return {React.ReactNode} The rendered component.
 */
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
