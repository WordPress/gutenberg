/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import PostContentInnerBlocks from './inner-blocks';

export default function PostContentEdit( {
	context: { postId: contextPostId, postType: contextPostType },
} ) {
	const { id: currentPostId, type: currentPostType } = useSelect(
		( select ) => select( 'core/editor' ).getCurrentPost() ?? {}
	);
	const blockProps = useBlockProps();

	// Only render InnerBlocks if the context is different from the active post
	// to avoid infinite recursion of post content.
	if (
		contextPostId &&
		contextPostType &&
		contextPostId !== currentPostId &&
		contextPostType !== currentPostType
	) {
		return (
			<div { ...blockProps }>
				<PostContentInnerBlocks
					postType={ contextPostType }
					postId={ contextPostId }
				/>
			</div>
		);
	}

	return (
		<div { ...blockProps }>
			<div className="wp-block-post-content__placeholder">
				<span>{ __( 'This is a placeholder for post content.' ) }</span>
			</div>
		</div>
	);
}
