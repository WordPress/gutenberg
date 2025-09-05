/**
 * WordPress dependencies
 */
import { BlockPreview } from '@wordpress/block-editor';
import { getBlockType, getBlockFromExample } from '@wordpress/blocks';
import { __experimentalSpacer as Spacer } from '@wordpress/components';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getVariationClassName } from './utils';

const BlockPreviewPanel = ( { name, variation = '' } ) => {
	const blockExample = getBlockType( name )?.example;
	const blocks = useMemo( () => {
		if ( ! blockExample ) {
			return null;
		}

		const example = {
			...blockExample,
			attributes: {
				...blockExample.attributes,
				style: undefined,
				className: variation
					? getVariationClassName( variation )
					: blockExample.attributes?.className,
			},
		};

		return getBlockFromExample( name, example );
	}, [ name, blockExample, variation ] );

	const viewportWidth = blockExample?.viewportWidth ?? 500;
	// Same as height of InserterPreviewPanel.
	const previewHeight = 144;
	const sidebarWidth = 235;
	const scale = sidebarWidth / viewportWidth;
	const minHeight =
		scale !== 0 && scale < 1 && previewHeight
			? previewHeight / scale
			: previewHeight;

	if ( ! blockExample ) {
		return null;
	}

	return (
		<Spacer marginX={ 4 } marginBottom={ 4 }>
			<div
				className="edit-site-global-styles__block-preview-panel"
				style={ { maxHeight: previewHeight, boxSizing: 'initial' } }
			>
				<BlockPreview
					blocks={ blocks }
					viewportWidth={ viewportWidth }
					minHeight={ previewHeight }
					additionalStyles={
						//We want this CSS to be in sync with the one in InserterPreviewPanel.
						[
							{
								css: `
								body{
									padding: 24px;
									min-height:${ Math.round( minHeight ) }px;
									display:flex;
									align-items:center;
								}
								.is-root-container { width: 100%; }
							`,
							},
						]
					}
				/>
			</div>
		</Spacer>
	);
};

export default BlockPreviewPanel;
