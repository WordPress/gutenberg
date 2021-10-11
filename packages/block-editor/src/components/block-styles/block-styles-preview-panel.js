/**
 * WordPress dependencies
 */
import { useMemo, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InserterPreviewPanel from '../inserter/preview-panel';
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
			// The left position of the target element,
			// minus any offset in relation to its parent container.
			rect.x - targetRef?.current.offsetLeft,
			rect.y,
			rect.width,
			rect.height
		);
	}, [ targetRef?.current ] );

	return (
		<Popover
			className="block-editor-block-styles__popover block-editor-block-styles__preview__popover "
			focusOnMount={ false }
			position="middle left"
			animate={ false }
			anchorRect={ getAnchorRect() }
		>
			<InserterPreviewPanel
				viewportWidth={ viewportWidth }
				item={ {
					title: style.label || style.name,
					name: style.name,
					description: style.description,
					attributes: style.attributes,
				} }
				blocks={ previewBlocks }
				isStylePreview={ true }
			/>
		</Popover>
	);
}
