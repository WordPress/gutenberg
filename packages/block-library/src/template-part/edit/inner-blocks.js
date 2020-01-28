/**
 * WordPress dependencies
 */
import { useEntityBlockEditor } from '@wordpress/core-data';
import { InnerBlocks } from '@wordpress/block-editor';

export default function TemplatePartInnerBlocks() {
	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		'wp_template_part',
		{
			initialEdits: { status: 'publish' },
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
