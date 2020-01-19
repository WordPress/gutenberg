/**
 * WordPress dependencies
 */
import { useEntityBlockEditor } from '@wordpress/core-data';
import { InnerBlocks } from '@wordpress/block-editor';

function PostContentInnerBlocks( { postType, postId } ) {
	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		postType,
		{
			id: postId,
		}
	);
	return (
		<InnerBlocks
			__experimentalBlocks={ blocks }
			onInput={ onInput }
			onChange={ onChange }
		/>
	);
}

export default function PostContentEdit( { context: { postType, postId } } ) {
	if ( ! postType || ! postId ) {
		return 'Post Content Placeholder';
	}

	return <PostContentInnerBlocks postType={ postType } postId={ postId } />;
}
