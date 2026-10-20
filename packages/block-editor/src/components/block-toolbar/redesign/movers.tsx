import type { ComponentType, ReactNode } from 'react';
import { __, isRTL } from '@wordpress/i18n';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	arrowDown,
	arrowLeft,
	arrowRight,
	arrowUp,
	dragHandle,
} from '@wordpress/icons';
import _BlockDraggable from '../../block-draggable';
import { store as blockEditorStore } from '../../../store';

// The draggable's JSDoc marks every prop as required.
const BlockDraggable = _BlockDraggable as unknown as ComponentType< {
	clientIds: string[];
	fadeWhenDisabled?: boolean;
	children: ( props: Record< string, unknown > ) => ReactNode;
} >;

/**
 * Bigger movers: a drag handle and full-size up and down buttons, on every
 * block that can move. In a horizontal parent (a Row) they point left and
 * right instead.
 *
 * @param props           Component props.
 * @param props.clientIds Selected blocks.
 */
export default function Movers( { clientIds }: { clientIds: string[] } ) {
	const { canMove, rootClientId, isFirst, isLast, orientation } = useSelect(
		( select ) => {
			const {
				getBlockIndex,
				getBlockListSettings,
				canMoveBlocks,
				getBlockOrder,
				getBlockRootClientId,
			} = select( blockEditorStore );
			const _rootClientId = getBlockRootClientId( clientIds[ 0 ] );
			const firstIndex = getBlockIndex( clientIds[ 0 ] );
			const lastIndex = getBlockIndex(
				clientIds[ clientIds.length - 1 ]
			);
			return {
				canMove: canMoveBlocks( clientIds ),
				rootClientId: _rootClientId,
				isFirst: firstIndex === 0,
				isLast: lastIndex === getBlockOrder( _rootClientId ).length - 1,
				orientation: getBlockListSettings( _rootClientId )?.orientation,
			};
		},
		[ clientIds ]
	);
	const { moveBlocksUp, moveBlocksDown } = useDispatch( blockEditorStore );

	if ( ! canMove || ( isFirst && isLast && ! rootClientId ) ) {
		return null;
	}

	const isHorizontal = orientation === 'horizontal';
	let backIcon = arrowUp;
	let forwardIcon = arrowDown;
	let backLabel: string = __( 'Move up' );
	let forwardLabel: string = __( 'Move down' );
	if ( isHorizontal ) {
		backIcon = isRTL() ? arrowRight : arrowLeft;
		forwardIcon = isRTL() ? arrowLeft : arrowRight;
		backLabel = isRTL() ? __( 'Move right' ) : __( 'Move left' );
		forwardLabel = isRTL() ? __( 'Move left' ) : __( 'Move right' );
	}

	return (
		<ToolbarGroup className="block-editor-block-toolbar-redesign__movers">
			<BlockDraggable clientIds={ clientIds } fadeWhenDisabled>
				{ ( draggableProps ) => (
					<ToolbarButton
						icon={ dragHandle }
						className="block-editor-block-toolbar-redesign__drag"
						label={ __( 'Drag' ) }
						// A drag handle only works with a pointer.
						tabIndex={ -1 }
						{ ...draggableProps }
					/>
				) }
			</BlockDraggable>
			<ToolbarButton
				icon={ backIcon }
				label={ backLabel }
				disabled={ isFirst }
				accessibleWhenDisabled
				onClick={ () => moveBlocksUp( clientIds, rootClientId ) }
			/>
			<ToolbarButton
				icon={ forwardIcon }
				label={ forwardLabel }
				disabled={ isLast }
				accessibleWhenDisabled
				onClick={ () => moveBlocksDown( clientIds, rootClientId ) }
			/>
		</ToolbarGroup>
	);
}
