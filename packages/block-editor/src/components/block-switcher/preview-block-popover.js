/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Popover } from '@wordpress/components';
import {
	getBlockType,
	cloneBlock,
	getBlockFromExample,
} from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import BlockPreview from '../block-preview';

export default function PreviewBlockPopover( {
	hoveredBlock,
	hoveredClassName,
} ) {
	const hoveredBlockType = getBlockType( hoveredBlock.name );
	return (
		<div className="block-editor-block-switcher__popover__preview__parent">
			<div className="block-editor-block-switcher__popover__preview__container">
				<Popover
					className="block-editor-block-switcher__preview__popover"
					position="bottom right"
					focusOnMount={ false }
				>
					<div className="block-editor-block-switcher__preview">
						<div className="block-editor-block-switcher__preview-title">
							{ __( 'Preview' ) }
						</div>
						<BlockPreview
							viewportWidth={ 500 }
							blocks={
								hoveredBlockType.example
									? getBlockFromExample( hoveredBlock.name, {
											attributes: {
												...hoveredBlockType.example
													.attributes,
												className: hoveredClassName,
											},
											innerBlocks:
												hoveredBlockType.example
													.innerBlocks,
									  } )
									: cloneBlock( hoveredBlock, {
											className: hoveredClassName,
									  } )
							}
						/>
					</div>
				</Popover>
			</div>
		</div>
	);
}
