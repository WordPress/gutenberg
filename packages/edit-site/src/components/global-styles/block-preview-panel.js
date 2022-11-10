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
	const padding = blockExample?.defaultPadding || '0 1rem';
	const scale = blockExample?.scale;

	return ! blockExample ? null : (
		<div className="edit-site-global-styles__block-preview-panel">
			{ containerResizeListener }

			<BlockPreview
				viewportWidth={ containerWidth }
				__experimentalScale={ scale }
				__experimentalPadding={ padding }
				__experimentalMinHeight={ containerHeight }
				__experimentalAlign={ 'center' }
				__experimentalJustify={ 'center' }
				blocks={ getBlockFromExample( name, blockExample ) }
			/>
		</div>
	);
};

export default BlockPreviewPanel;
