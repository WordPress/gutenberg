/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';
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
	const example = getBlockType( genericPreviewBlock.name )?.example;
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
			example,
		};
	}, [ genericPreviewBlock, styleClassName ] );

	return <InserterPreviewPanel item={ previewBlocks } />;
}
