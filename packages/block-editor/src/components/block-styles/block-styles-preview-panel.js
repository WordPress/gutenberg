/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockPreview from '../block-preview';
import { replaceActiveStyle } from './utils';

export default function BlockStylesPreviewPanel( {
	genericPreviewBlock,
	viewportWidth,
	style,
	className,
	activeStyle,
} ) {
	const styleClassName = replaceActiveStyle( className, activeStyle, style );
	const previewBlocks = useMemo( () => {
		return {
			...genericPreviewBlock,
			attributes: {
				...genericPreviewBlock.attributes,
				className:
					styleClassName +
					' block-editor-block-styles__block-preview-container',
			},
		};
	}, [ genericPreviewBlock, styleClassName ] );

	// TODO: look at packages/block-editor/src/components/block-switcher/preview-block-popover.js
	return (
		<div className="block-editor-block-styles__preview-container">
			<div className="block-editor-block-styles__preview-content">
				<BlockPreview
					viewportWidth={ viewportWidth }
					blocks={ previewBlocks }
				/>
			</div>
			<div className="block-editor-block-styles__preview-panel-label">
				{ style.label || style.name }
			</div>
		</div>
	);
}
