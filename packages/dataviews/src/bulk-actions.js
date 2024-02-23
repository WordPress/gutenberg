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
import { cog } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';

const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuGroupV2: DropdownMenuGroup,
	DropdownMenuItemV2: DropdownMenuItem,
} = unlock( componentsPrivateApis );

export function useHasAPossibleBulkAction( actions, item ) {
	return useMemo( () => {
		return actions.some( ( action ) => {
			return action.supportsBulk && action.isEligible( item );
		} );
	}, [ actions, item ] );
}

export function useSomeItemHasAPossibleBulkAction( actions, data ) {
	return useMemo( () => {
		return data.some( ( item ) => {
			return actions.some( ( action ) => {
				return action.supportsBulk && action.isEligible( item );
			} );
		} );
	}, [ actions, data ] );
}

function ActionWithModal( {
	action,
	selectedItems,
	setActionWithModal,
	onMenuOpenChange,
} ) {
	const eligibleItems = useMemo( () => {
		return selectedItems.filter( ( item ) => action.isEligible( item ) );
	}, [ action, selectedItems ] );
	const { RenderModal, hideModalHeader } = action;
	const onCloseModal = useCallback( () => {
		setActionWithModal( undefined );
	}, [ setActionWithModal ] );
	return (
		<Modal
			title={ ! hideModalHeader && action.label }
			__experimentalHideHeader={ !! hideModalHeader }
			onRequestClose={ onCloseModal }
			overlayClassName="dataviews-action-modal"
		>
			<RenderModal
				items={ eligibleItems }
				closeModal={ onCloseModal }
				onPerform={ () => onMenuOpenChange( false ) }
			/>
		</Modal>
	);
}

function BulkActionItem( { action, selectedItems, setActionWithModal } ) {
	const eligibleItems = useMemo( () => {
		return selectedItems.filter( ( item ) => action.isEligible( item ) );
	}, [ action, selectedItems ] );

	const shouldShowModal = !! action.RenderModal;

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

function ActionsMenuGroup( { actions, selectedItems, setActionWithModal } ) {
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
		</>
	);
}

export default function BulkActions( { data, actions, selection, getItemId } ) {
	const bulkActions = useMemo(
		() => actions.filter( ( action ) => action.supportsBulk ),
		[ actions ]
	);
	const [ isMenuOpen, onMenuOpenChange ] = useState( false );
	const [ actionWithModal, setActionWithModal ] = useState();

	const selectedItems = useMemo( () => {
		return data.filter( ( item ) =>
			selection.includes( getItemId( item ) )
		);
	}, [ selection, data, getItemId ] );

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
						size="compact"
						label={
							selection.length
								? sprintf(
										/* translators: %d: Number of items. */
										_n(
											'Edit %d item',
											'Edit %d items',
											selection.length
										),
										selection.length
								  )
								: __( 'Bulk edit' )
						}
						icon={ cog }
						disabled={ selection.length === 0 }
					/>
				}
			>
				<ActionsMenuGroup
					actions={ bulkActions }
					setActionWithModal={ setActionWithModal }
					selectedItems={ selectedItems }
				/>
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
