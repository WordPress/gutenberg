import clsx from 'clsx';
import { plus } from '@wordpress/icons';
import {
	ToolbarGroup,
	ToolbarItem,
	ToolbarButton,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { _x, sprintf } from '@wordpress/i18n';
import Inserter from '../inserter';
import { BlockMoverUpButton, BlockMoverDownButton } from './button';
import { store as blockEditorStore } from '../../store';

function BlockMover( { clientIds, hideDragHandle } ) {
	const {
		canMove,
		rootClientId,
		nextSiblingClientId,
		isFirst,
		isLast,
		orientation,
		isManualGrid,
	} = useSelect(
		( select ) => {
			const {
				getBlockIndex,
				getBlockListSettings,
				canMoveBlocks,
				getBlockOrder,
				getBlockRootClientId,
				getBlockAttributes,
				getNextBlockClientId,
			} = select( blockEditorStore );
			const normalizedClientIds = Array.isArray( clientIds )
				? clientIds
				: [ clientIds ];
			const firstClientId = normalizedClientIds[ 0 ];
			const lastClientId =
				normalizedClientIds[ normalizedClientIds.length - 1 ];
			const _rootClientId = getBlockRootClientId( firstClientId );
			const firstIndex = getBlockIndex( firstClientId );
			const lastIndex = getBlockIndex( lastClientId );
			const blockOrder = getBlockOrder( _rootClientId );
			const { layout = {} } = getBlockAttributes( _rootClientId ) ?? {};

			return {
				canMove: canMoveBlocks( clientIds ),
				rootClientId: _rootClientId,
				nextSiblingClientId: getNextBlockClientId( lastClientId ),
				isFirst: firstIndex === 0,
				isLast: lastIndex === blockOrder.length - 1,
				orientation: getBlockListSettings( _rootClientId )?.orientation,
				isManualGrid:
					layout.type === 'grid' &&
					layout.isManualPlacement &&
					window.__experimentalEnableGridInteractivity,
			};
		},
		[ clientIds ]
	);

	if (
		! canMove ||
		( isFirst && isLast && ! rootClientId ) ||
		( hideDragHandle && isManualGrid )
	) {
		return null;
	}

	return (
		<ToolbarGroup
			className={ clsx( 'block-editor-block-mover', {
				'is-horizontal': orientation === 'horizontal',
			} ) }
		>
			{ ! hideDragHandle && (
				<Inserter
					position="bottom right"
					rootClientId={ rootClientId }
					clientId={ nextSiblingClientId }
					isAppender={ ! nextSiblingClientId }
					__experimentalIsQuick
					renderToggle={ ( {
						onToggle,
						isOpen,
						disabled,
						blockTitle,
						hasSingleBlockType,
					} ) => (
						<ToolbarButton
							className="block-editor-block-mover__inserter"
							onClick={ onToggle }
							aria-expanded={ isOpen }
							disabled={ disabled }
							label={
								hasSingleBlockType
									? sprintf(
											// translators: %s: the name of the block when there is only one
											_x(
												'Add %s',
												'directly add the only allowed block'
											),
											blockTitle.toLowerCase()
									  )
									: _x(
											'Add block',
											'Generic label for block inserter button'
									  )
							}
							showTooltip
							icon={ plus }
						/>
					) }
				/>
			) }
			{ ! isManualGrid && (
				<div className="block-editor-block-mover__move-button-container">
					<ToolbarItem>
						{ ( itemProps ) => (
							<BlockMoverUpButton
								clientIds={ clientIds }
								{ ...itemProps }
							/>
						) }
					</ToolbarItem>
					<ToolbarItem>
						{ ( itemProps ) => (
							<BlockMoverDownButton
								clientIds={ clientIds }
								{ ...itemProps }
							/>
						) }
					</ToolbarItem>
				</div>
			) }
		</ToolbarGroup>
	);
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-mover/README.md
 */
export default BlockMover;
