/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InserterPreviewPanel from '../inserter/preview-panel';
import { replaceActiveStyle } from './utils';

export default function BlockStylesPreviewPanel( {
	genericPreviewBlock,
	style,
	className,
	activeStyle,
} ) {
	const styleClassName = replaceActiveStyle( className, activeStyle, style );
	const previewBlocks = useMemo( () => {
		return {
			name: genericPreviewBlock.name,
			title: style.label || style.name,
			description: style.description,
			initialAttributes: {
				...genericPreviewBlock.attributes,
				className:
					styleClassName +
					' block-editor-block-styles__block-preview-container',
			},
			example: genericPreviewBlock,
		};
	}, [ genericPreviewBlock, style, styleClassName ] );

	return <InserterPreviewPanel item={ previewBlocks } />;
}
