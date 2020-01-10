/**
 * WordPress dependencies
 */
import { useEntityBlockEditor, useEntityId } from '@wordpress/core-data';
import { InnerBlocks } from '@wordpress/block-editor';

function PostContentInnerBlocks() {
	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		'post'
	);
	return (
		<InnerBlocks
			__experimentalBlocks={ blocks }
			onInput={ onInput }
			onChange={ onChange }
		/>
	);
}

export default function PostContentEdit() {
	if ( ! useEntityId( 'postType', 'post' ) ) {
		return 'Post Content Placeholder';
	}

	return <PostContentInnerBlocks />;
}
