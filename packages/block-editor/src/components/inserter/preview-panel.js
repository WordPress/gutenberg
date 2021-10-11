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

function InserterPreviewPanel( {
	item,
	blocks,
	viewportWidth,
	isStylePreview,
} ) {
	//const { name, title, icon, description, initialAttributes } = item;
	const hoveredItemBlockType = getBlockType( item?.name );
	const isReusable = isReusableBlock( item );
	let previewBlocks;

	if ( blocks ) {
		previewBlocks = blocks;
	} else {
		previewBlocks = hoveredItemBlockType.example
			? getBlockFromExample( item?.name, {
					attributes: {
						...hoveredItemBlockType?.example?.attributes,
						...item?.initialAttributes,
					},
					innerBlocks: hoveredItemBlockType.example.innerBlocks,
			  } )
			: createBlock( item?.name, item?.initialAttributes );
	}

	return (
		<div className="block-editor-inserter__preview-container">
			<div className="block-editor-inserter__preview">
				{ isReusable ||
				hoveredItemBlockType?.example ||
				isStylePreview ? (
					<div className="block-editor-inserter__preview-content">
						<BlockPreview
							__experimentalPadding={ 16 }
							viewportWidth={
								hoveredItemBlockType?.example?.viewportWidth ||
								viewportWidth ||
								500
							}
							blocks={ previewBlocks }
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
					title={ item?.title }
					icon={ item?.icon }
					description={ item?.description }
				/>
			) }
		</div>
	);
}

export default InserterPreviewPanel;
