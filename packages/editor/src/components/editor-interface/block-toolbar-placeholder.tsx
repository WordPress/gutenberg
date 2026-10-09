// @ts-expect-error No exported types
import { BlockIcon } from '@wordpress/block-editor';
import { getBlockType, getDefaultBlockName } from '@wordpress/blocks';
import { Toolbar, ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { chevronDown, chevronUp } from '@wordpress/icons';

/**
 * Disabled stand-in for the block toolbar while no block is selected: the
 * default block's icon and the mover arrows.
 */
export default function BlockToolbarPlaceholder() {
	const defaultBlockName = getDefaultBlockName();
	const blockType = defaultBlockName
		? getBlockType( defaultBlockName )
		: null;

	return (
		<Toolbar
			label={ __( 'Block tools' ) }
			variant="unstyled"
			className="block-editor-block-contextual-toolbar editor-block-toolbar-placeholder"
		>
			<div className="block-editor-block-toolbar">
				<ToolbarGroup className="block-editor-block-toolbar__block-controls">
					{ blockType && (
						<ToolbarButton
							disabled
							icon={
								<BlockIcon
									className="block-editor-block-toolbar__block-icon"
									icon={ blockType.icon }
								/>
							}
							label={ blockType.title }
						/>
					) }
					<ToolbarGroup className="block-editor-block-mover">
						<div className="block-editor-block-mover__move-button-container">
							<ToolbarButton
								disabled
								className="block-editor-block-mover-button is-up-button"
								icon={ chevronUp }
								label={ __( 'Move up' ) }
							/>
							<ToolbarButton
								disabled
								className="block-editor-block-mover-button is-down-button"
								icon={ chevronDown }
								label={ __( 'Move down' ) }
							/>
						</div>
					</ToolbarGroup>
				</ToolbarGroup>
			</div>
		</Toolbar>
	);
}
