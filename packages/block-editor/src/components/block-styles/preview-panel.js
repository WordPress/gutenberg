/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InserterPreviewPanel from '../inserter/preview-panel';
import { replaceActiveStyle } from './utils';
import { Popover } from '@wordpress/components';

export default function BlockStylesPreviewPanel( {
	genericPreviewBlock,
	style,
	className,
	activeStyle,
} ) {
	const styleClassName = replaceActiveStyle( className, activeStyle, style );
	const previewBlocks = useMemo( () => {
		return {
			...genericPreviewBlock,
			title: style.label || style.name,
			description: style.description,
			initialAttributes: {
				...genericPreviewBlock.attributes,
				className:
					styleClassName +
					' block-editor-block-styles__block-preview-container',
			},
		};
	}, [ genericPreviewBlock, styleClassName ] );

	return (
		<Popover
			className="block-editor-block-styles__popover block-editor-block-styles__preview__popover "
			focusOnMount={ false }
			position="middle left"
			animate={ false }
		>
			<InserterPreviewPanel
				item={ previewBlocks }
				isStylePreview={ true }
			/>
		</Popover>
	);
}
