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
		<div className="block-editor-inserter__menu-help-panel">
			{ ! isReusableBlock( item ) && <BlockCard blockType={ item } /> }
			<div className="block-editor-inserter__preview">
				{ isReusableBlock( item ) || hoveredItemBlockType.example ? (
					<div className="block-editor-inserter__preview-content">
						<BlockPreview
							padding={ 10 }
							viewportWidth={ 500 }
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
							autoHeight
						/>
					</div>
				) : (
					<div className="block-editor-inserter__preview-content-missing">
						{ __( 'No Preview Available.' ) }
					</div>
				) }
			</div>
		</div>
	);
}

export default InserterPreviewPanel;
