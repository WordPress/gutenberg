/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../post-type-support-check';
import { store as editorStore } from '../../store';

/**
 * Component for checking if the post type supports the excerpt field.
 *
 * @param {Object}  props          Props.
 * @param {Element} props.children Children to be rendered.
 *
 * @return {Component} The component to be rendered.
 */
function PostExcerptCheck( { children } ) {
	const postType = useSelect( ( select ) => {
		const { getEditedPostAttribute } = select( editorStore );
		return getEditedPostAttribute( 'type' );
	}, [] );

	// This special case is unfortunate, but the REST API of wp_template and wp_template_part
	// support the excerpt field throught the "description" field rather than "excerpt" which means
	// the default ExcerptPanel won't work for these.
	if ( [ 'wp_template', 'wp_template_part' ].includes( postType ) ) {
		return null;
	}

	return (
		<PostTypeSupportCheck supportKeys="excerpt">
			{ children }
		</PostTypeSupportCheck>
	);
}

export default PostExcerptCheck;
