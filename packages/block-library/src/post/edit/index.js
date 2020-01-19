/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { InnerBlocks } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import PostPlaceholder from './placeholder';

export default function PostEdit( {
	attributes: { postType, postId },
	setAttributes,
} ) {
	const loaded = useSelect(
		( select ) => {
			if ( ! postType || ! postId ) {
				return false;
			}
			return Boolean(
				select( 'core' ).getEntityRecord( 'postType', postType, postId )
			);
		},
		[ postType, postId ]
	);
	if ( postType && postId ) {
		if ( ! loaded ) {
			return null;
		}
		return <InnerBlocks />;
	}
	return <PostPlaceholder setAttributes={ setAttributes } />;
}
