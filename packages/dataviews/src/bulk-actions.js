/**
 * WordPress dependencies
 */
import {
	privateApis as componentsPrivateApis,
	Button,
	Modal,
} from '@wordpress/components';
import { __, sprintf, _n } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';

const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuGroupV2: DropdownMenuGroup,
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuSeparatorV2: DropdownMenuSeparator,
} = unlock( componentsPrivateApis );

function ActionWithModal( { action, selectedItems, setActionWithModal } ) {
	const eligibleItems = useMemo( () => {
		return selectedItems.filter( ( item ) => action.isEligible( item ) );
	}, [ action, selectedItems ] );
	const { RenderModal, hideModalHeader } = action;
	return (
		<Modal
			title={ ! hideModalHeader && action.label }
			__experimentalHideHeader={ !! hideModalHeader }
			onRequestClose={ () => {
				setActionWithModal( undefined );
			} }
			overlayClassName="dataviews-action-modal"
		>
			<RenderModal
				items={ eligibleItems }
				closeModal={ () => setActionWithModal( undefined ) }
			/>
		</Modal>
	);
}

function BulkActionItem( {
	action,
	selectedItems,
	onMenuOpenChange,
	setActionWithModal,
} ) {
	const eligibleItems = useMemo( () => {
		return selectedItems.filter( ( item ) => action.isEligible( item ) );
	}, [ action, selectedItems ] );
	return (
		<DropdownMenuItem
			key={ action.id }
			disabled={ eligibleItems.length === 0 }
			onClick={ async ( event ) => {
				event.preventDefault();
				if ( !! action.RenderModal ) {
					onMenuOpenChange( false );
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

function ActionsMenuGroup( {
	actions,
	selectedItems,
	onMenuOpenChange,
	setActionWithModal,
} ) {
	const bulkActions = actions.filter( ( action ) => action.supportsBulk );
	if ( bulkActions.length === 0 ) {
		return null;
	}
	return (
		<>
			<DropdownMenuGroup>
				{ bulkActions.map( ( action ) => (
					<BulkActionItem
						key={ action.id }
						action={ action }
						selectedItems={ selectedItems }
						onMenuOpenChange={ onMenuOpenChange }
						setActionWithModal={ setActionWithModal }
					/>
				) ) }
			</DropdownMenuGroup>
			<DropdownMenuSeparator />
		</>
	);
}

export default function BulkActions( {
	data,
	actions,
	selection,
	onSelectionChange,
	getItemId,
} ) {
	const areAllSelected = selection && selection.length === data.length;
	const [ isMenuOpen, onMenuOpenChange ] = useState( false );
	const [ actionWithModal, setActionWithModal ] = useState();
	const selectedItems = useMemo( () => {
		return data.filter( ( item ) =>
			selection.includes( getItemId( item ) )
		);
	}, [ selection, data, getItemId ] );
	return (
		<>
			<DropdownMenu
				open={ isMenuOpen }
				onOpenChange={ onMenuOpenChange }
				label={ __( 'Filters' ) }
				trigger={
					<Button>
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
					actions={ actions }
					data={ data }
					selection={ selection }
					getItemId={ getItemId }
					onMenuOpenChange={ onMenuOpenChange }
					setActionWithModal={ setActionWithModal }
					selectedItems={ selectedItems }
				/>
				<DropdownMenuGroup>
					<DropdownMenuItem
						disabled={ areAllSelected }
						onClick={ ( event ) => {
							event.preventDefault();
							onSelectionChange( data );
						} }
						suffix={ data.length }
					>
						{ __( 'Select all' ) }
					</DropdownMenuItem>
					<DropdownMenuItem
						disabled={ selection.length === 0 }
						onClick={ ( event ) => {
							event.preventDefault();
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
				/>
			) }
		</>
	);
}
