/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalBlock as Block } from '@wordpress/block-editor';
/**
 * Internal dependencies
 */
import PostContentInnerBlocks from './inner-blocks';

export default function PostContentEdit( { context: { postId, postType } } ) {
	if ( postId && postType ) {
		return (
			<Block.div>
				<PostContentInnerBlocks
					postType={ postType }
					postId={ postId }
				/>
			</Block.div>
		);
	}
	return <p>{ __( 'This is a placeholder for post content.' ) }</p>;
}
