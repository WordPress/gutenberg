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
	const sidebarWidth = 280;
	const viewportWidth = example?.viewportWidth ?? 500;
	const scale = sidebarWidth / viewportWidth;
	const minHeight =
		scale !== 0 && scale < 1 && previewHeight
			? previewHeight / scale
			: previewHeight;

	return (
		<div className="block-editor-inserter__preview-container">
			<div className="block-editor-inserter__preview">
				{ isReusable || example ? (
					<div className="block-editor-inserter__preview-content">
						<BlockPreview
							blocks={ blocks }
							viewportWidth={ viewportWidth }
							minHeight={ previewHeight }
							additionalStyles={
								//We want this CSS to be in sync with the one in BlockPreviewPanel.
								[
									{
										css: `
										body { 
											padding: 24px;
											min-height:${ Math.round( minHeight ) }px;
											display:flex;
											align-items:center;
										}
										.is-root-container { width: 100%; }
									`,
									},
								]
							}
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
