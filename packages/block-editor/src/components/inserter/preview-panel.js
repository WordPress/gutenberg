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
	const { name, title, icon, description, initialAttributes } = item;
	const hoveredItemBlockType = getBlockType( name );
	const isReusable = isReusableBlock( item );
	return (
		<div className="block-editor-inserter__preview-container">
			<div className="block-editor-inserter__preview">
				{ isReusable || hoveredItemBlockType?.example ? (
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
												...initialAttributes,
											},
											innerBlocks:
												hoveredItemBlockType.example
													.innerBlocks,
									  } )
									: createBlock( name, initialAttributes )
							}
						/>
					</div>
				) : (
					<div className="block-editor-inserter__preview-content-missing">
						{ __( 'No Preview Available.' ) }
					</div>
				) }
			</div>
			{ ! isReusable && (
				<BlockCard
					title={ title }
					icon={ icon }
					description={ description }
				/>
			) }
		</div>
	);
}

export default InserterPreviewPanel;
