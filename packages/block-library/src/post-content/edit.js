/**
 * WordPress dependencies
 */
import { EntityProvider } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import PostContentInnerBlocks from './inner-blocks';

export default function PostContentEdit( { context } ) {
	const { postId, postType } = context;
	if ( postId && postType ) {
		return (
			<EntityProvider kind="postType" type={ postType } id={ postId }>
				<PostContentInnerBlocks postType={ postType } />
			</EntityProvider>
		);
	}
	return (
		<p>{ 'Try setting the active page or post via the page selector.' }</p>
	);
}
