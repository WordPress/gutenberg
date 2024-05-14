/**
 * External dependencies
 */
import type { MouseEventHandler, ReactElement } from 'react';

/**
 * WordPress dependencies
 */
import {
	Button,
	Modal,
	__experimentalHStack as HStack,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import { moreVertical } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';
import type { Action, ActionModal as ActionModalType, Item } from './types';

const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuGroupV2: DropdownMenuGroup,
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuItemLabelV2: DropdownMenuItemLabel,
	kebabCase,
} = unlock( componentsPrivateApis );

interface ButtonTriggerProps {
	action: Action;
	onClick: MouseEventHandler;
}

interface DropdownMenuItemTriggerProps {
	action: Action;
	onClick: MouseEventHandler;
}

interface ActionModalProps {
	action: ActionModalType;
	items: Item[];
	closeModal?: () => void;
}

interface ActionWithModalProps extends ActionModalProps {
	ActionTrigger: (
		props: ButtonTriggerProps | DropdownMenuItemTriggerProps
	) => ReactElement;
	isBusy?: boolean;
}

interface ActionsDropdownMenuGroupProps {
	actions: Action[];
	item: Item;
}

interface ItemActionsProps {
	item: Item;
	actions: Action[];
	isCompact: boolean;
}

interface CompactItemActionsProps {
	item: Item;
	actions: Action[];
}

function ButtonTrigger( { action, onClick }: ButtonTriggerProps ) {
	return (
		<Button
			label={ action.label }
			icon={ action.icon }
			isDestructive={ action.isDestructive }
			size="compact"
			onClick={ onClick }
		/>
	);
}

function DropdownMenuItemTrigger( {
	action,
	onClick,
}: DropdownMenuItemTriggerProps ) {
	return (
		<DropdownMenuItem
			onClick={ onClick }
			hideOnClick={ ! ( 'RenderModal' in action ) }
		>
			<DropdownMenuItemLabel>{ action.label }</DropdownMenuItemLabel>
		</DropdownMenuItem>
	);
}

export function ActionModal( { action, items, closeModal }: ActionModalProps ) {
	return (
		<Modal
			title={ action.modalHeader || action.label }
			__experimentalHideHeader={ !! action.hideModalHeader }
			onRequestClose={ closeModal ?? ( () => {} ) }
			overlayClassName={ `dataviews-action-modal dataviews-action-modal__${ kebabCase(
				action.id
			) }` }
		>
			<action.RenderModal
				items={ items }
				closeModal={ closeModal }
				onActionStart={ action.onActionStart }
				onActionPerformed={ action.onActionPerformed }
			/>
		</Modal>
	);
}

export function ActionWithModal( {
	action,
	items,
	ActionTrigger,
	isBusy,
}: ActionWithModalProps ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const actionTriggerProps = {
		action,
		onClick: () => {
			setIsModalOpen( true );
		},
		items,
		isBusy,
	};
	return (
		<>
			<ActionTrigger { ...actionTriggerProps } />
			{ isModalOpen && (
				<ActionModal
					action={ action }
					items={ items }
					closeModal={ () => setIsModalOpen( false ) }
				/>
			) }
		</>
	);
}

export function ActionsDropdownMenuGroup( {
	actions,
	item,
}: ActionsDropdownMenuGroupProps ) {
	return (
		<DropdownMenuGroup>
			{ actions.map( ( action ) => {
				if ( 'RenderModal' in action ) {
					return (
						<ActionWithModal
							key={ action.id }
							action={ action }
							items={ [ item ] }
							ActionTrigger={ DropdownMenuItemTrigger }
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

export default function ItemActions( {
	item,
	actions,
	isCompact,
}: ItemActionsProps ) {
	const { primaryActions, eligibleActions } = useMemo( () => {
		// If an action is eligible for all items, doesn't need
		// to provide the `isEligible` function.
		const _eligibleActions = actions.filter(
			( action ) => ! action.isEligible || action.isEligible( item )
		);
		const _primaryActions = _eligibleActions.filter(
			( action ) => action.isPrimary && !! action.icon
		);
		return {
			primaryActions: _primaryActions,
			eligibleActions: _eligibleActions,
		};
	}, [ actions, item ] );
	if ( isCompact ) {
		return <CompactItemActions item={ item } actions={ eligibleActions } />;
	}
	return (
		<HStack
			spacing={ 1 }
			justify="flex-end"
			className="dataviews-item-actions"
			style={ {
				flexShrink: '0',
				width: 'auto',
			} }
		>
			{ !! primaryActions.length &&
				primaryActions.map( ( action ) => {
					if ( 'RenderModal' in action ) {
						return (
							<ActionWithModal
								key={ action.id }
								action={ action }
								items={ [ item ] }
								ActionTrigger={ ButtonTrigger }
							/>
						);
					}
					return (
						<ButtonTrigger
							key={ action.id }
							action={ action }
							onClick={ () => action.callback( [ item ] ) }
						/>
					);
				} ) }
			<CompactItemActions item={ item } actions={ eligibleActions } />
		</HStack>
	);
}

function CompactItemActions( { item, actions }: CompactItemActionsProps ) {
	return (
		<DropdownMenu
			trigger={
				<Button
					size="compact"
					icon={ moreVertical }
					label={ __( 'Actions' ) }
					disabled={ ! actions.length }
					className="dataviews-all-actions-button"
				/>
			}
			placement="bottom-end"
		>
			<ActionsDropdownMenuGroup actions={ actions } item={ item } />
		</DropdownMenu>
	);
}
