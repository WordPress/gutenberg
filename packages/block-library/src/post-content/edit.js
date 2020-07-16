/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PostContentInnerBlocks from './inner-blocks';

export default function PostContentEdit( { context: { postId, postType } } ) {
	if ( postId && postType && postType !== 'wp_template' ) {
		return (
			<PostContentInnerBlocks postType={ postType } postId={ postId } />
		);
	}
	return <p>{ __( 'This is a placeholder for post content.' ) }</p>;
}
