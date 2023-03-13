/**
 * WordPress dependencies
 */
import { BlockPreview } from '@wordpress/block-editor';
import { getBlockType, getBlockFromExample } from '@wordpress/blocks';
import { __experimentalSpacer as Spacer } from '@wordpress/components';

const BlockPreviewPanel = ( { name, variation = '' } ) => {
	const blockExample = getBlockType( name )?.example;
	const blockExampleWithVariation = {
		...blockExample,
		attributes: {
			...blockExample?.attributes,
			className: variation,
		},
	};
	const blocks =
		blockExample &&
		getBlockFromExample(
			name,
			variation ? blockExampleWithVariation : blockExample
		);
	const viewportWidth = blockExample?.viewportWidth || null;
	const previewHeight = '150px';

	return ! blockExample ? null : (
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
									min-height:${ previewHeight };
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
