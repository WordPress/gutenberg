/**
 * WordPress dependencies
 */
import { EntityProvider } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PostContentInnerBlocks from './inner-blocks';

export default function PostContentEdit( { context: { postId, postType } } ) {
	if ( postId && postType ) {
		return (
			<EntityProvider kind="postType" type={ postType } id={ postId }>
				<PostContentInnerBlocks postType={ postType } />
			</EntityProvider>
		);
	}
	return <p>{ __( 'This is a placeholder for post content.' ) }</p>;
}
