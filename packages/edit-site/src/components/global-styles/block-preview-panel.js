/**
 * WordPress dependencies
 */
import { BlockPreview } from '@wordpress/block-editor';
import { getBlockType, getBlockFromExample } from '@wordpress/blocks';
import { useResizeObserver } from '@wordpress/compose';

const BlockPreviewPanel = ( { name } ) => {
	const blockExample = getBlockType( name )?.example;
	const [
		containerResizeListener,
		{ width: containerWidth, height: containerHeight },
	] = useResizeObserver();
	const viewportWidth = blockExample?.viewportWidth || containerWidth;

	return ! blockExample ? null : (
		<div className="edit-site-global-styles__block-preview-panel">
			{ containerResizeListener }

			<BlockPreview
				viewportWidth={ viewportWidth }
				__experimentalMinHeight={ containerHeight }
				blocks={ getBlockFromExample( name, blockExample ) }
			/>
		</div>
	);
};

export default BlockPreviewPanel;
