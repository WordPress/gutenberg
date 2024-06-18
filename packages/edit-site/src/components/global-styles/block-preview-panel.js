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

		let example = blockExample;
		if ( variation ) {
			example = {
				...example,
				attributes: {
					...example.attributes,
					className: getVariationClassName( variation ),
				},
			};
		}

		return getBlockFromExample( name, example );
	}, [ name, blockExample, variation ] );

	const viewportWidth = blockExample?.viewportWidth ?? null;
	const previewHeight = 150;

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
					additionalStyles={ [
						{
							css: `
								body{
									min-height:${ previewHeight }px;
									display:flex;align-items:center;justify-content:center;
								}
							`,
						},
					] }
				/>
			</div>
		</Spacer>
	);
};

export default BlockPreviewPanel;
