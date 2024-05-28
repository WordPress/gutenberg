/**
 * WordPress dependencies
 */
import {
	privateApis as componentsPrivateApis,
	Button,
	Modal,
} from '@wordpress/components';
import { __, sprintf, _n } from '@wordpress/i18n';
import { useMemo, useState, useCallback, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';
import type { Action, ActionModal, AnyItem } from './types';

const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuGroupV2: DropdownMenuGroup,
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuSeparatorV2: DropdownMenuSeparator,
} = unlock( componentsPrivateApis );

interface ActionWithModalProps< Item extends AnyItem > {
	action: ActionModal< Item >;
	selectedItems: Item[];
	setActionWithModal: ( action?: ActionModal< Item > ) => void;
	onMenuOpenChange: ( isOpen: boolean ) => void;
}

interface BulkActionsItemProps< Item extends AnyItem > {
	action: Action< Item >;
	selectedItems: Item[];
	setActionWithModal: ( action?: ActionModal< Item > ) => void;
}

interface ActionsMenuGroupProps< Item extends AnyItem > {
	actions: Action< Item >[];
	selectedItems: Item[];
	setActionWithModal: ( action?: ActionModal< Item > ) => void;
}

interface BulkActionsProps< Item extends AnyItem > {
	data: Item[];
	actions: Action< Item >[];
	selection: string[];
	onSelectionChange: ( selection: Item[] ) => void;
	getItemId: ( item: Item ) => string;
}

export function useHasAPossibleBulkAction< Item extends AnyItem >(
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

export function useSomeItemHasAPossibleBulkAction< Item extends AnyItem >(
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

function ActionWithModal< Item extends AnyItem >( {
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

function BulkActionItem< Item extends AnyItem >( {
	action,
	selectedItems,
	setActionWithModal,
}: BulkActionsItemProps< Item > ) {
	const eligibleItems = useMemo( () => {
		return selectedItems.filter(
			( item ) => ! action.isEligible || action.isEligible( item )
		);
	}, [ action, selectedItems ] );

	const shouldShowModal = 'RenderModal' in action;

	return (
		<DropdownMenuItem
			key={ action.id }
			disabled={ eligibleItems.length === 0 }
			hideOnClick={ ! shouldShowModal }
			onClick={ async () => {
				if ( shouldShowModal ) {
					setActionWithModal( action );
				} else {
					await action.callback( eligibleItems );
				}
			} }
			suffix={
				eligibleItems.length > 0 ? eligibleItems.length : undefined
			}
		>
			{ action.label }
		</DropdownMenuItem>
	);
}

function ActionsMenuGroup< Item extends AnyItem >( {
	actions,
	selectedItems,
	setActionWithModal,
}: ActionsMenuGroupProps< Item > ) {
	return (
		<>
			<DropdownMenuGroup>
				{ actions.map( ( action ) => (
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

export default function BulkActions< Item extends AnyItem >( {
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
	const areAllSelected =
		selection && selection.length === numberSelectableItems;

	const selectedItems = useMemo( () => {
		return data.filter( ( item ) =>
			selection.includes( getItemId( item ) )
		);
	}, [ selection, data, getItemId ] );

	const hasNonSelectableItemSelected = useMemo( () => {
		return selectedItems.some( ( item ) => {
			return ! selectableItems.includes( item );
		} );
	}, [ selectedItems, selectableItems ] );
	useEffect( () => {
		if ( hasNonSelectableItemSelected ) {
			onSelectionChange(
				selectedItems.filter( ( selectedItem ) => {
					return selectableItems.some( ( item ) => {
						return getItemId( selectedItem ) === getItemId( item );
					} );
				} )
			);
		}
	}, [
		hasNonSelectableItemSelected,
		selectedItems,
		selectableItems,
		getItemId,
		onSelectionChange,
	] );

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
						{ selection.length
							? sprintf(
									/* translators: %d: Number of items. */
									_n(
										'Edit %d item',
										'Edit %d items',
										selection.length
									),
									selection.length
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
							onSelectionChange( selectableItems );
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
