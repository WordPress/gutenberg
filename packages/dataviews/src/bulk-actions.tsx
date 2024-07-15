/**
 * WordPress dependencies
 */
import {
	privateApis as componentsPrivateApis,
	Button,
	Modal,
} from '@wordpress/components';
import { __, sprintf, _n } from '@wordpress/i18n';
import { useMemo, useState, useCallback } from '@wordpress/element';
import { useRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';
import type { Action, ActionModal } from './types';
import type { SetSelection } from './private-types';

const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuGroupV2: DropdownMenuGroup,
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuSeparatorV2: DropdownMenuSeparator,
} = unlock( componentsPrivateApis );

interface ActionWithModalProps< Item > {
	action: ActionModal< Item >;
	selectedItems: Item[];
	setActionWithModal: ( action?: ActionModal< Item > ) => void;
	onMenuOpenChange: ( isOpen: boolean ) => void;
}

interface BulkActionsItemProps< Item > {
	action: Action< Item >;
	selectedItems: Item[];
	setActionWithModal: ( action?: ActionModal< Item > ) => void;
}

interface ActionsMenuGroupProps< Item > {
	actions: Action< Item >[];
	selectedItems: Item[];
	setActionWithModal: ( action?: ActionModal< Item > ) => void;
}

interface BulkActionsProps< Item > {
	data: Item[];
	actions: Action< Item >[];
	selection: string[];
	onSelectionChange: SetSelection;
	getItemId: ( item: Item ) => string;
}

export function useHasAPossibleBulkAction< Item >(
	actions: Action< Item >[],
	item: Item
) {
	return useMemo( () => {
		return actions.some( ( action ) => {
			return (
				action.supportsBulk &&
				( ! action.isEligible || action.isEligible( item ) )
			);
		} );
	}, [ actions, item ] );
}

export function useSomeItemHasAPossibleBulkAction< Item >(
	actions: Action< Item >[],
	data: Item[]
) {
	return useMemo( () => {
		return data.some( ( item ) => {
			return actions.some( ( action ) => {
				return (
					action.supportsBulk &&
					( ! action.isEligible || action.isEligible( item ) )
				);
			} );
		} );
	}, [ actions, data ] );
}

function ActionWithModal< Item >( {
	action,
	selectedItems,
	setActionWithModal,
	onMenuOpenChange,
}: ActionWithModalProps< Item > ) {
	const eligibleItems = useMemo( () => {
		return selectedItems.filter(
			( item ) => ! action.isEligible || action.isEligible( item )
		);
	}, [ action, selectedItems ] );
	const { RenderModal, hideModalHeader } = action;
	const onCloseModal = useCallback( () => {
		setActionWithModal( undefined );
	}, [ setActionWithModal ] );
	const label =
		typeof action.label === 'string'
			? action.label
			: action.label( selectedItems );
	return (
		<Modal
			title={ ! hideModalHeader ? label : undefined }
			__experimentalHideHeader={ !! hideModalHeader }
			onRequestClose={ onCloseModal }
			overlayClassName="dataviews-action-modal"
		>
			<RenderModal
				items={ eligibleItems }
				closeModal={ onCloseModal }
				onActionPerformed={ () => onMenuOpenChange( false ) }
			/>
		</Modal>
	);
}

function BulkActionItem< Item >( {
	action,
	selectedItems,
	setActionWithModal,
}: BulkActionsItemProps< Item > ) {
	const registry = useRegistry();
	const eligibleItems = useMemo( () => {
		return selectedItems.filter(
			( item ) => ! action.isEligible || action.isEligible( item )
		);
	}, [ action, selectedItems ] );

	const shouldShowModal = 'RenderModal' in action;

	return (
		<DropdownMenuItem
			key={ action.id }
			hideOnClick={ ! shouldShowModal }
			onClick={ async () => {
				if ( shouldShowModal ) {
					setActionWithModal( action );
				} else {
					action.callback( eligibleItems, { registry } );
				}
			} }
			suffix={ eligibleItems.length }
		>
			{ action.label }
		</DropdownMenuItem>
	);
}

function ActionsMenuGroup< Item >( {
	actions,
	selectedItems,
	setActionWithModal,
}: ActionsMenuGroupProps< Item > ) {
	const elligibleActions = useMemo( () => {
		return actions.filter( ( action ) => {
			return selectedItems.some(
				( item ) => ! action.isEligible || action.isEligible( item )
			);
		} );
	}, [ actions, selectedItems ] );

	return (
		<>
			<DropdownMenuGroup>
				{ elligibleActions.map( ( action ) => (
					<BulkActionItem
						key={ action.id }
						action={ action }
						selectedItems={ selectedItems }
						setActionWithModal={ setActionWithModal }
					/>
				) ) }
			</DropdownMenuGroup>
			<DropdownMenuSeparator />
		</>
	);
}

export default function BulkActions< Item >( {
	data,
	actions,
	selection,
	onSelectionChange,
	getItemId,
}: BulkActionsProps< Item > ) {
	const bulkActions = useMemo(
		() => actions.filter( ( action ) => action.supportsBulk ),
		[ actions ]
	);
	const [ isMenuOpen, onMenuOpenChange ] = useState( false );
	const [ actionWithModal, setActionWithModal ] = useState<
		ActionModal< Item > | undefined
	>();
	const selectableItems = useMemo( () => {
		return data.filter( ( item ) => {
			return bulkActions.some(
				( action ) => ! action.isEligible || action.isEligible( item )
			);
		} );
	}, [ data, bulkActions ] );

	const numberSelectableItems = selectableItems.length;

	const selectedItems = useMemo( () => {
		return data.filter(
			( item ) =>
				selection.includes( getItemId( item ) ) &&
				selectableItems.includes( item )
		);
	}, [ selection, data, getItemId, selectableItems ] );

	const areAllSelected = selectedItems.length === numberSelectableItems;

	if ( bulkActions.length === 0 ) {
		return null;
	}
	return (
		<>
			<DropdownMenu
				open={ isMenuOpen }
				onOpenChange={ onMenuOpenChange }
				label={ __( 'Bulk actions' ) }
				style={ { minWidth: '240px' } }
				trigger={
					<Button
						className="dataviews-bulk-edit-button"
						__next40pxDefaultSize
						variant="tertiary"
						size="compact"
					>
						{ selectedItems.length
							? sprintf(
									/* translators: %d: Number of items. */
									_n(
										'Edit %d item',
										'Edit %d items',
										selectedItems.length
									),
									selectedItems.length
							  )
							: __( 'Bulk edit' ) }
					</Button>
				}
			>
				<ActionsMenuGroup
					actions={ bulkActions }
					setActionWithModal={ setActionWithModal }
					selectedItems={ selectedItems }
				/>
				<DropdownMenuGroup>
					<DropdownMenuItem
						disabled={ areAllSelected }
						hideOnClick={ false }
						onClick={ () => {
							onSelectionChange(
								selectableItems.map( ( item ) =>
									getItemId( item )
								)
							);
						} }
						suffix={ numberSelectableItems }
					>
						{ __( 'Select all' ) }
					</DropdownMenuItem>
					<DropdownMenuItem
						disabled={ selection.length === 0 }
						hideOnClick={ false }
						onClick={ () => {
							onSelectionChange( [] );
						} }
					>
						{ __( 'Deselect' ) }
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenu>
			{ actionWithModal && (
				<ActionWithModal
					action={ actionWithModal }
					selectedItems={ selectedItems }
					setActionWithModal={ setActionWithModal }
					onMenuOpenChange={ onMenuOpenChange }
				/>
			) }
		</>
	);
}
