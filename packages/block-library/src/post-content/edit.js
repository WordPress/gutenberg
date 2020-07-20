/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostContentInnerBlocks from './inner-blocks';

export default function PostContentEdit( { context: { postId, postType } } ) {
	const { id, type } = useSelect( ( select ) => {
		return select( 'core/editor' ).getCurrentPost() ?? {};
	} );

	// Only render InnerBlocks if the context is different from the active post
	// to avoid infinite recursion of post content.
	if ( postId && postType && postId !== id && postType !== type ) {
		return (
			<PostContentInnerBlocks postType={ postType } postId={ postId } />
		);
	}
	return (
		<div className="wp-block-post-content__placeholder">
			<span>{ __( 'This is a placeholder for post content.' ) }</span>
		</div>
	);
}
