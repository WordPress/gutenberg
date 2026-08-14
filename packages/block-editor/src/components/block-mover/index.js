import clsx from 'clsx';
import { ToolbarGroup, ToolbarItem } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { BlockMoverUpButton, BlockMoverDownButton } from './button';
import { store as blockEditorStore } from '../../store';

function BlockMover( { clientIds, hideDragHandle } ) {
	const {
		canMove,
		rootClientId,
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
			} = select( blockEditorStore );
			const normalizedClientIds = Array.isArray( clientIds )
				? clientIds
				: [ clientIds ];
			const firstClientId = normalizedClientIds[ 0 ];
			const _rootClientId = getBlockRootClientId( firstClientId );
			const firstIndex = getBlockIndex( firstClientId );
			const lastIndex = getBlockIndex(
				normalizedClientIds[ normalizedClientIds.length - 1 ]
			);
			const blockOrder = getBlockOrder( _rootClientId );
			const { layout = {} } = getBlockAttributes( _rootClientId ) ?? {};

			return {
				canMove: canMoveBlocks( clientIds ),
				rootClientId: _rootClientId,
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
