/**
 * WordPress dependencies
 */
import { useMemo, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockPreview from '../block-preview';
import { replaceActiveStyle } from './utils';
import { Popover } from '@wordpress/components';

export default function BlockStylesPreviewPanel( {
	genericPreviewBlock,
	viewportWidth,
	style,
	className,
	activeStyle,
	targetRef,
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

	const getAnchorRect = useCallback( () => {
		if ( ! targetRef?.current || ! window.DOMRect ) {
			return null;
		}
		const rect = targetRef?.current.getBoundingClientRect();

		return new window.DOMRect(
			rect.x - targetRef?.current.offsetLeft,
			rect.y,
			rect.width,
			rect.height
		);
	}, [ targetRef?.current ] );

	return (
		<div className="block-editor-block-styles__popover__preview__parent">
			<div className="block-editor-block-styles__popover__preview__container">
				<Popover
					className="block-editor-block-styles__preview__popover"
					focusOnMount={ false }
					position="middle left"
					animate={ false }
					anchorRect={ getAnchorRect() }
				>
					<div className="block-editor-block-styles__preview">
						<div className="block-editor-block-styles__preview-title">
							{ style.label || style.name }
						</div>
						<BlockPreview
							viewportWidth={ viewportWidth }
							blocks={ previewBlocks }
						/>
					</div>
				</Popover>
			</div>
		</div>
	);
}
