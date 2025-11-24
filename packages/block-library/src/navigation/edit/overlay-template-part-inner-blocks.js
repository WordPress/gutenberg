/**
 * WordPress dependencies
 */
import { useEntityBlockEditor } from '@wordpress/core-data';
import { useInnerBlocksProps } from '@wordpress/block-editor';

export default function OverlayTemplatePartInnerBlocks( {
	overlayTemplatePartId,
} ) {
	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		'wp_template_part',
		{ id: overlayTemplatePartId }
	);

	const innerBlocksProps = useInnerBlocksProps(
		{
			className: 'wp-block-navigation__container',
		},
		{
			value: blocks,
			onInput,
			onChange,
			renderAppender: false,
		}
	);

	return <div { ...innerBlocksProps } />;
}
