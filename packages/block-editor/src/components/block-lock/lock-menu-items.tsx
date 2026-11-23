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
 * styles, which locks the controls of the Styles tab, layout,
 * where the blocks have one, movement and deletion. Each change applies right away to the blocks
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
		isStylesLocked,
		canStylesLock,
		canLayoutLock,
		canChangeLayoutLock,
		isEverySyncedPattern,
	} = useSelect(
		( select ) => {
			const {
				isMoveLockedBlock,
				isRemoveLockedBlock,
				isLayoutLockedBlock,
				isStylesLockedBlock,
				canStylesLockBlock,
				canLayoutLockBlock,
				isPatternLockedBlock,
				getBlockName,
			} = unlock( select( blockEditorStore ) );
			const layoutLockableIds = clientIds.filter( canLayoutLockBlock );
			// A synced pattern or a template part keeps its styles in itself.
			const stylesLockableIds = clientIds.filter( canStylesLockBlock );
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
				isStylesLocked:
					stylesLockableIds.length > 0 &&
					stylesLockableIds.every( isStylesLockedBlock ),
				canStylesLock: stylesLockableIds.length > 0,
				canLayoutLock: layoutLockableIds.length > 0,
				canChangeLayoutLock: layoutChangeableIds.length > 0,
				isEverySyncedPattern:
					clientIds.length > 0 &&
					clientIds.every(
						( clientId ) =>
							getBlockName( clientId ) === 'core/block'
					),
			};
		},
		[ clientIds ]
	);

	// Every block whose layout can be locked is a pattern, whose layout is the
	// pattern's, so say why the option can't be changed. A synced pattern's
	// layout is edited in the pattern itself, so it has no layout lock here.
	const isLayoutSetByPattern = canLayoutLock && ! canChangeLayoutLock;

	// Layout is an option only where it exists: a block that holds other
	// blocks in a layout of its own, or a synced pattern, whose layout is set
	// in the pattern. A Paragraph, an Image or a List has none to lock.
	const hasLayoutOption = canLayoutLock || isEverySyncedPattern;

	const isAllLocked =
		isMoveLocked &&
		isRemoveLocked &&
		( ! canLayoutLock || isLayoutLocked ) &&
		( ! canStylesLock || isStylesLocked );

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
						styles: checked,
					} )
				}
			>
				<Menu.ItemLabel>{ __( 'All properties' ) }</Menu.ItemLabel>
			</Menu.CheckboxItem>
			<Menu.Separator />
			{ /* A synced pattern or a template part keeps its styles in itself. */ }
			{ canStylesLock && (
				<Menu.CheckboxItem
					checked={ isStylesLocked }
					closeOnClick={ false }
					onCheckedChange={ ( styles ) =>
						setBlocksLock( clientIds, { styles } )
					}
				>
					<Menu.ItemLabel>{ __( 'Styles' ) }</Menu.ItemLabel>
				</Menu.CheckboxItem>
			) }
			{ hasLayoutOption && (
				<Menu.CheckboxItem
					checked={ isLayoutLocked }
					disabled={ ! canChangeLayoutLock }
					closeOnClick={ false }
					onCheckedChange={ ( layout ) =>
						setBlocksLock( clientIds, { layout } )
					}
				>
					<Menu.ItemLabel>{ __( 'Layout' ) }</Menu.ItemLabel>
					{ isLayoutSetByPattern && (
						<Menu.ItemDescription>
							{ __( 'Disabled by Pattern' ) }
						</Menu.ItemDescription>
					) }
					{ isEverySyncedPattern && (
						<Menu.ItemDescription>
							{ __( 'Disabled by Synced pattern' ) }
						</Menu.ItemDescription>
					) }
				</Menu.CheckboxItem>
			) }
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
