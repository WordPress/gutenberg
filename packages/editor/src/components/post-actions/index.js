/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	privateApis as componentsPrivateApis,
	Button,
	Modal,
} from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { usePostActions } from './actions';
import { store as editorStore } from '../../store';

const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuGroupV2: DropdownMenuGroup,
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuItemLabelV2: DropdownMenuItemLabel,
	kebabCase,
} = unlock( componentsPrivateApis );

export default function PostActions( { onActionPerformed, buttonProps } ) {
	const [ isActionsMenuOpen, setIsActionsMenuOpen ] = useState( false );
	const { item, postType } = useSelect( ( select ) => {
		const { getCurrentPostType, getCurrentPostId } = select( editorStore );
		const { getEditedEntityRecord } = select( coreStore );
		const _postType = getCurrentPostType();
		return {
			item: getEditedEntityRecord(
				'postType',
				_postType,
				getCurrentPostId()
			),
			postType: _postType,
		};
	}, [] );
	const allActions = usePostActions( postType, onActionPerformed );

	const actions = useMemo( () => {
		return allActions.filter( ( action ) => {
			return ! action.isEligible || action.isEligible( item );
		} );
	}, [ allActions, item ] );

	return (
		<DropdownMenu
			open={ isActionsMenuOpen }
			trigger={
				<Button
					size="small"
					icon={ moreVertical }
					label={ __( 'Actions' ) }
					disabled={ ! actions.length }
					__experimentalIsFocusable
					className="editor-all-actions-button"
					onClick={ () =>
						setIsActionsMenuOpen( ! isActionsMenuOpen )
					}
					{ ...buttonProps }
				/>
			}
			onOpenChange={ setIsActionsMenuOpen }
			placement="bottom-end"
		>
			<ActionsDropdownMenuGroup
				actions={ actions }
				item={ item }
				onClose={ () => {
					setIsActionsMenuOpen( false );
				} }
			/>
		</DropdownMenu>
	);
}

// From now on all the functions on this file are copied as from the dataviews packages,
// The editor packages should not be using the dataviews packages directly,
// and the dataviews package should not be using the editor packages directly,
// so duplicating the code here seems like the least bad option.

// Copied as is from packages/dataviews/src/item-actions.js
function DropdownMenuItemTrigger( { action, onClick } ) {
	return (
		<DropdownMenuItem
			onClick={ onClick }
			hideOnClick={ ! action.RenderModal }
		>
			<DropdownMenuItemLabel>{ action.label }</DropdownMenuItemLabel>
		</DropdownMenuItem>
	);
}

// Copied as is from packages/dataviews/src/item-actions.js
// With an added onClose prop.
function ActionWithModal( { action, item, ActionTrigger, onClose } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const actionTriggerProps = {
		action,
		onClick: () => setIsModalOpen( true ),
	};
	const { RenderModal, hideModalHeader } = action;
	return (
		<>
			<ActionTrigger { ...actionTriggerProps } />
			{ isModalOpen && (
				<Modal
					title={ action.modalHeader || action.label }
					__experimentalHideHeader={ !! hideModalHeader }
					onRequestClose={ () => {
						setIsModalOpen( false );
					} }
					overlayClassName={ `editor-action-modal editor-action-modal__${ kebabCase(
						action.id
					) }` }
				>
					<RenderModal
						items={ [ item ] }
						closeModal={ () => {
							setIsModalOpen( false );
							onClose();
						} }
					/>
				</Modal>
			) }
		</>
	);
}

// Copied as is from packages/dataviews/src/item-actions.js
// With an added onClose prop.
function ActionsDropdownMenuGroup( { actions, item, onClose } ) {
	return (
		<DropdownMenuGroup>
			{ actions.map( ( action ) => {
				if ( action.RenderModal ) {
					return (
						<ActionWithModal
							key={ action.id }
							action={ action }
							item={ item }
							ActionTrigger={ DropdownMenuItemTrigger }
							onClose={ onClose }
						/>
					);
				}
				return (
					<DropdownMenuItemTrigger
						key={ action.id }
						action={ action }
						onClick={ () => action.callback( [ item ] ) }
					/>
				);
			} ) }
		</DropdownMenuGroup>
	);
}
