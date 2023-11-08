/**
 * WordPress dependencies
 */
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	Button,
	Modal,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import { moreVertical } from '@wordpress/icons';

function PrimaryActionTrigger( { action, onClick } ) {
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

function SecondaryActionTrigger( { action, onClick } ) {
	return (
		<MenuItem onClick={ onClick } isDestructive={ action.isDestructive }>
			{ action.label }
		</MenuItem>
	);
}

function MaybeWithModal( { action, item } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const actionTriggerProps = {
		action,
		onClick: action.modalProps ? setIsModalOpen : action.perform,
	};
	const ActionTrigger = action.isPrimary
		? PrimaryActionTrigger
		: SecondaryActionTrigger;
	if ( ! action.modalProps ) {
		return <ActionTrigger { ...actionTriggerProps } />;
	}
	const { ModalContent, ...modalProps } = action.modalProps;
	return (
		<>
			<ActionTrigger { ...actionTriggerProps } />
			{ isModalOpen && (
				<Modal
					{ ...modalProps }
					onRequestClose={ () => {
						setIsModalOpen( false );
					} }
					__experimentalHideHeader={ ! modalProps.title }
				>
					<ModalContent
						item={ item }
						setIsModalOpen={ setIsModalOpen }
					/>
				</Modal>
			) }
		</>
	);
}

export default function ItemActions( { item, actions } ) {
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
	return (
		<HStack justify="flex-end">
			{ !! primaryActions.length &&
				primaryActions.map( ( action ) => (
					<MaybeWithModal
						key={ action.id }
						action={ action }
						item={ item }
					/>
				) ) }
			{ !! secondaryActions.length && (
				<DropdownMenu icon={ moreVertical } label={ __( 'Actions' ) }>
					{ () => (
						<MenuGroup>
							{ secondaryActions.map( ( action ) => (
								<MaybeWithModal
									key={ action.id }
									action={ action }
									item={ item }
								/>
							) ) }
						</MenuGroup>
					) }
				</DropdownMenu>
			) }
		</HStack>
	);
}
