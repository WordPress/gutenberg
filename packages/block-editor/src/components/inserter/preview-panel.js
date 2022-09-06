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
	const { name, title, icon, description, initialAttributes, example } = item;
	const isReusable = isReusableBlock( item );
	const hoveredItemBlockType = getBlockType( name );
	const exampleBlock = example ?? hoveredItemBlockType?.example;

	return (
		<div className="block-editor-inserter__preview-container">
			<div className="block-editor-inserter__preview">
				{ isReusable || exampleBlock ? (
					<div className="block-editor-inserter__preview-content">
						<BlockPreview
							__experimentalPadding={ 16 }
							viewportWidth={ exampleBlock?.viewportWidth ?? 500 }
							blocks={
								exampleBlock
									? getBlockFromExample( item.name, {
											attributes: {
												...exampleBlock?.attributes,
												...initialAttributes,
											},
											innerBlocks:
												exampleBlock?.innerBlocks,
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
