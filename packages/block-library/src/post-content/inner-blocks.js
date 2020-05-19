/**
 * WordPress dependencies
 */
import { useEntityBlockEditor } from '@wordpress/core-data';
import { InnerBlocks } from '@wordpress/block-editor';

export default function PostContentInnerBlocks( { postType, postId } ) {
	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		postType,
		{},
		postId
	);
	return (
		<InnerBlocks
			value={ blocks }
			onInput={ onInput }
			onChange={ onChange }
		/>
	);
}
