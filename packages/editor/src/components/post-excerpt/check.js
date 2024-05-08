/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../post-type-support-check';

/**
 * Component for checking if the post type supports the excerpt field.
 *
 * @param {Object}  props          Props.
 * @param {Element} props.children Children to be rendered.
 *
 * @return {Component} The component to be rendered.
 */
function PostExcerptCheck( { children } ) {
	return (
		<PostTypeSupportCheck supportKeys="excerpt">
			{ children }
		</PostTypeSupportCheck>
	);
}

export default PostExcerptCheck;
