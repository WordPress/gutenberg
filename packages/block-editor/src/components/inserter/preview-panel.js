/**
 * WordPress dependencies
 */
import {
	isReusableBlock,
	createBlock,
	getBlockType,
	getBlockFromExample,
} from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockCard from '../block-card';
import BlockPreview from '../block-preview';

function InserterPreviewPanel( { item } ) {
	const { name, title, icon, description, initialAttributes } = item;
	const isReusable = isReusableBlock( item );
	const hoveredItemBlockType = getBlockType( name );
	const example = item.example || hoveredItemBlockType.example;

	return (
		<div className="block-editor-inserter__preview-container">
			<div className="block-editor-inserter__preview">
				{ isReusable || example ? (
					<div className="block-editor-inserter__preview-content">
						<BlockPreview
							__experimentalPadding={ 16 }
							viewportWidth={ example?.viewportWidth ?? 500 }
							blocks={
								example
									? getBlockFromExample( name, {
											attributes: {
												...example.attributes,
												...initialAttributes,
											},
											innerBlocks: example.innerBlocks,
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
