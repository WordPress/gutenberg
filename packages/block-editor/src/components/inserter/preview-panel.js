/**
 * WordPress dependencies
 */
import {
	isReusableBlock,
	createBlock,
	getBlockFromExample,
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
	return (
		<div className="block-editor-inserter__preview-container">
			<div className="block-editor-inserter__preview">
				{ isReusable || example ? (
					<div className="block-editor-inserter__preview-content">
						<BlockPreview
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
							viewportWidth={ example?.viewportWidth ?? 500 }
							additionalStyles={ [
								{ css: 'body { padding: 16px; }' },
							] }
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
