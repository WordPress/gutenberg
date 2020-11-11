/**
 * WordPress dependencies
 */
import {
	isReusableBlock,
	createBlock,
	getBlockFromExample,
	getBlockType,
} from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockCard from '../block-card';
import BlockPreview from '../block-preview';

function InserterPreviewPanel( { item } ) {
	const hoveredItemBlockType = getBlockType( item.name );
	return (
		<div className="block-editor-inserter__preview-container">
			<div className="block-editor-inserter__preview">
				{ isReusableBlock( item ) || hoveredItemBlockType.example ? (
					<div className="block-editor-inserter__preview-content">
						<BlockPreview
							__experimentalPadding={ 16 }
							viewportWidth={
								hoveredItemBlockType.example?.viewportWidth ??
								500
							}
							blocks={
								hoveredItemBlockType.example
									? getBlockFromExample( item.name, {
											attributes: {
												...hoveredItemBlockType.example
													.attributes,
												...item.initialAttributes,
											},
											innerBlocks:
												hoveredItemBlockType.example
													.innerBlocks,
									  } )
									: createBlock(
											item.name,
											item.initialAttributes
									  )
							}
						/>
					</div>
				) : (
					<div className="block-editor-inserter__preview-content-missing">
						{ __( 'No Preview Available.' ) }
					</div>
				) }
			</div>
			{ ! isReusableBlock( item ) && <BlockCard blockType={ item } /> }
		</div>
	);
}

export default InserterPreviewPanel;
