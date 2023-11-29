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
import { unlock } from '../../lock-unlock';

const {
	DropdownMenuV2Ariakit: DropdownMenu,
	DropdownMenuGroupV2Ariakit: DropdownMenuGroup,
	DropdownMenuItemV2Ariakit: DropdownMenuItem,
	DropdownMenuItemLabelV2Ariakit: DropdownMenuItemLabel,
} = unlock( componentsPrivateApis );

function ButtonTrigger( { action, onClick } ) {
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

function DropdownMenuItemTrigger( { action, onClick } ) {
	return (
		<DropdownMenuItem onClick={ onClick }>
			<DropdownMenuItemLabel>{ action.label }</DropdownMenuItemLabel>
		</DropdownMenuItem>
	);
}

function ActionWithModal( { action, item, ActionTrigger } ) {
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
					title={ ! hideModalHeader && action.label }
					__experimentalHideHeader={ !! hideModalHeader }
					onRequestClose={ () => {
						setIsModalOpen( false );
					} }
					overlayClassName="dataviews-action-modal"
				>
					<RenderModal
						item={ item }
						closeModal={ () => setIsModalOpen( false ) }
					/>
				</Modal>
			) }
		</>
	);
}

function ActionsDropdownMenuGroup( { actions, item } ) {
	return (
		<DropdownMenuGroup>
			{ actions.map( ( action ) => {
				if ( !! action.RenderModal ) {
					return (
						<ActionWithModal
							key={ action.id }
							action={ action }
							item={ item }
							ActionTrigger={ DropdownMenuItemTrigger }
						/>
					);
				}
				return (
					<DropdownMenuItemTrigger
						key={ action.id }
						action={ action }
						onClick={ () => action.callback( item ) }
					/>
				);
			} ) }
		</DropdownMenuGroup>
	);
}

export default function ItemActions( { item, actions, isCompact } ) {
	const { primaryActions, secondaryActions } = useMemo( () => {
		return actions.reduce(
			( accumulator, action ) => {
				// If an action is eligible for all items, doesn't need
				// to provide the `isEligible` function.
				if ( action.isEligible && ! action.isEligible( item ) ) {
					return accumulator;
				}
				if ( action.isPrimary && !! action.icon ) {
					accumulator.primaryActions.push( action );
				} else {
					accumulator.secondaryActions.push( action );
				}
				return accumulator;
			},
			{ primaryActions: [], secondaryActions: [] }
		);
	}, [ actions, item ] );
	if ( ! primaryActions.length && ! secondaryActions.length ) {
		return null;
	}
	if ( isCompact ) {
		return (
			<CompactItemActions
				item={ item }
				primaryActions={ primaryActions }
				secondaryActions={ secondaryActions }
			/>
		);
	}
	return (
		<HStack
			spacing={ 1 }
			justify="flex-end"
			style={ {
				flexShrink: '0',
				width: 'auto',
			} }
		>
			{ !! primaryActions.length &&
				primaryActions.map( ( action ) => {
					if ( !! action.RenderModal ) {
						return (
							<ActionWithModal
								key={ action.id }
								action={ action }
								item={ item }
								ActionTrigger={ ButtonTrigger }
							/>
						);
					}
					return (
						<ButtonTrigger
							key={ action.id }
							action={ action }
							onClick={ () => action.callback( item ) }
						/>
					);
				} ) }
			{ !! secondaryActions.length && (
				<DropdownMenu
					trigger={
						<Button
							size="compact"
							icon={ moreVertical }
							label={ __( 'Actions' ) }
						/>
					}
					placement="bottom-end"
				>
					<ActionsDropdownMenuGroup
						actions={ secondaryActions }
						item={ item }
					/>
				</DropdownMenu>
			) }
		</HStack>
	);
}

function CompactItemActions( { item, primaryActions, secondaryActions } ) {
	return (
		<DropdownMenu
			trigger={
				<Button
					size="compact"
					icon={ moreVertical }
					label={ __( 'Actions' ) }
				/>
			}
			placement="bottom-end"
		>
			{ !! primaryActions.length && (
				<ActionsDropdownMenuGroup
					actions={ primaryActions }
					item={ item }
				/>
			) }
			{ !! secondaryActions.length && (
				<ActionsDropdownMenuGroup
					actions={ secondaryActions }
					item={ item }
				/>
			) }
		</DropdownMenu>
	);
}
