/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { EntityProvider } from '@wordpress/core-data';
import { InnerBlocks } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import PostPlaceholder from './placeholder';

export default function PostEdit( { attributes: { postId }, setAttributes } ) {
	const loaded = useSelect(
		( select ) => {
			if ( ! postId ) {
				return false;
			}
			return Boolean(
				select( 'core' ).getEntityRecord( 'postType', 'post', postId )
			);
		},
		[ postId ]
	);
	if ( postId ) {
		if ( ! loaded ) {
			return null;
		}
		return (
			<EntityProvider kind="postType" type="post" id={ postId }>
				<InnerBlocks />
			</EntityProvider>
		);
	}
	return <PostPlaceholder setAttributes={ setAttributes } />;
}
