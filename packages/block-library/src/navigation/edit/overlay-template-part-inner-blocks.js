/**
 * WordPress dependencies
 */
import { useEntityBlockEditor } from '@wordpress/core-data';
import { useInnerBlocksProps } from '@wordpress/block-editor';
import { OverlayToggleContext } from './use-overlay-toggle-control';

export default function OverlayTemplatePartInnerBlocks( {
	overlayTemplatePartId,
	onClose,
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

	return (
		<OverlayToggleContext.Provider value={ onClose }>
			<div { ...innerBlocksProps } />
		</OverlayToggleContext.Provider>
	);
}
