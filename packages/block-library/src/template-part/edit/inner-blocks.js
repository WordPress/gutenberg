/**
 * WordPress dependencies
 */
import { useEntityBlockEditor } from '@wordpress/core-data';
import { InnerBlocks } from '@wordpress/block-editor';

export default function TemplatePartInnerBlocks( {
	postId: id,
	hasInnerBlocks,
} ) {
	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		'wp_template_part',
		{ id }
	);
	return (
		<InnerBlocks
			value={ blocks }
			onInput={ onInput }
			onChange={ onChange }
			renderAppender={
				hasInnerBlocks
					? undefined
					: () => <InnerBlocks.ButtonBlockAppender />
			}
		/>
	);
}
