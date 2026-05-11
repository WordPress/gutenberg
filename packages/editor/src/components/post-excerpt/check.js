/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../post-type-support-check';

/**
 * Component for checking if the post type supports the excerpt field.
 *
 * @param {Object}          props          Props.
 * @param {React.ReactNode} props.children Children to be rendered.
 *
 * @return {React.ReactNode} The rendered component.
 */
function PostExcerptCheck( { children } ) {
	return (
		<PostTypeSupportCheck supportKeys="excerpt">
			{ children }
		</PostTypeSupportCheck>
	);
}

export default PostExcerptCheck;
