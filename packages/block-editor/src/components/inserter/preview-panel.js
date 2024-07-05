/**
 * WordPress dependencies
 */
import {
	isReusableBlock,
	createBlock,
	getBlockFromExample,
} from '@wordpress/blocks';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockCard from '../block-card';
import BlockPreview from '../block-preview';

function InserterPreviewPanel( { item } ) {
	const { name, title, icon, description, initialAttributes, example } = item;
	const isReusable = isReusableBlock( item );
	const blocks = useMemo( () => {
		if ( ! example ) {
			return createBlock( name, initialAttributes );
		}
		return getBlockFromExample( name, {
			attributes: {
				...example.attributes,
				...initialAttributes,
			},
			innerBlocks: example.innerBlocks,
		} );
	}, [ name, example, initialAttributes ] );
	// Same as height of BlockPreviewPanel.
	const previewHeight = 144;

	return (
		<div className="block-editor-inserter__preview-container">
			<div className="block-editor-inserter__preview">
				{ isReusable || example ? (
					<div className="block-editor-inserter__preview-content">
						<BlockPreview
							blocks={ blocks }
							viewportWidth={ example?.viewportWidth ?? 350 }
							minHeight={ previewHeight }
							additionalStyles={ [
								{
									css: `body { 
									padding: 24px;
									min-height:100%;
									display:flex;align-items:center;justify-content:center; }`,
								},
							] }
						/>
					</div>
				) : (
					<div className="block-editor-inserter__preview-content-missing">
						{ __( 'No preview available.' ) }
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
