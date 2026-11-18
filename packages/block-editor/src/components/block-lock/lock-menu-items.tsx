import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
	Menu,
} from '@wordpress/ui';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import type { BlockLockMenuProps } from './types';

/**
 * Renders the checkbox items of the lock menu: all properties, then
 * styles, which locks editing the content and styles of the blocks, layout,
 * movement and deletion. Each change applies right away to the blocks
 * and every block inside them, and the menu stays open so several properties
 * can be toggled in one pass.
 *
 * With several blocks, an item is checked when every block has it locked.
 */
export default function BlockLockMenuItems( {
	clientIds,
}: BlockLockMenuProps ) {
	const { setBlocksLock } = unlock( useDispatch( blockEditorStore ) );
	const {
		isMoveLocked,
		isRemoveLocked,
		isLayoutLocked,
		isEditLocked,
		canLayoutLock,
		canChangeLayoutLock,
	} = useSelect(
		( select ) => {
			const {
				isMoveLockedBlock,
				isRemoveLockedBlock,
				isLayoutLockedBlock,
				isEditLockedBlock,
				canLayoutLockBlock,
				isPatternLockedBlock,
			} = unlock( select( blockEditorStore ) );
			const layoutLockableIds = clientIds.filter( canLayoutLockBlock );
			// A pattern's layout is the pattern's own, so it stays as it is.
			const layoutChangeableIds = layoutLockableIds.filter(
				( clientId ) => ! isPatternLockedBlock( clientId )
			);

			return {
				isMoveLocked: clientIds.every( isMoveLockedBlock ),
				isRemoveLocked: clientIds.every( isRemoveLockedBlock ),
				isLayoutLocked:
					layoutLockableIds.length > 0 &&
					layoutLockableIds.every( isLayoutLockedBlock ),
				isEditLocked: clientIds.every( isEditLockedBlock ),
				canLayoutLock: layoutLockableIds.length > 0,
				canChangeLayoutLock: layoutChangeableIds.length > 0,
			};
		},
		[ clientIds ]
	);

	const isAllLocked =
		isMoveLocked &&
		isRemoveLocked &&
		( ! canLayoutLock || isLayoutLocked ) &&
		isEditLocked;

	return (
		<>
			<Menu.CheckboxItem
				checked={ isAllLocked }
				closeOnClick={ false }
				onCheckedChange={ ( checked ) =>
					setBlocksLock( clientIds, {
						move: checked,
						remove: checked,
						layout: checked,
						edit: checked,
					} )
				}
			>
				<Menu.ItemLabel>{ __( 'All properties' ) }</Menu.ItemLabel>
			</Menu.CheckboxItem>
			<Menu.Separator />
			<Menu.CheckboxItem
				checked={ isEditLocked }
				closeOnClick={ false }
				onCheckedChange={ ( edit ) =>
					setBlocksLock( clientIds, { edit } )
				}
			>
				<Menu.ItemLabel>{ __( 'Styles' ) }</Menu.ItemLabel>
			</Menu.CheckboxItem>
			<Menu.CheckboxItem
				checked={ isLayoutLocked }
				disabled={ ! canChangeLayoutLock }
				closeOnClick={ false }
				onCheckedChange={ ( layout ) =>
					setBlocksLock( clientIds, { layout } )
				}
			>
				<Menu.ItemLabel>{ __( 'Layout' ) }</Menu.ItemLabel>
			</Menu.CheckboxItem>
			<Menu.CheckboxItem
				checked={ isMoveLocked }
				closeOnClick={ false }
				onCheckedChange={ ( move ) =>
					setBlocksLock( clientIds, { move } )
				}
			>
				<Menu.ItemLabel>{ __( 'Movement' ) }</Menu.ItemLabel>
			</Menu.CheckboxItem>
			<Menu.CheckboxItem
				checked={ isRemoveLocked }
				closeOnClick={ false }
				onCheckedChange={ ( remove ) =>
					setBlocksLock( clientIds, { remove } )
				}
			>
				<Menu.ItemLabel>{ __( 'Deletion' ) }</Menu.ItemLabel>
			</Menu.CheckboxItem>
		</>
	);
}
