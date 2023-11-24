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
				primaryActions.map( ( action ) => {
					if ( !! action.RenderModal ) {
						return (
							<ActionWithModal
								key={ action.id }
								action={ action }
								item={ item }
								ActionTrigger={ PrimaryActionTrigger }
							/>
						);
					}
					return (
						<PrimaryActionTrigger
							key={ action.id }
							action={ action }
							onClick={ () => action.callback( item ) }
						/>
					);
				} ) }
			{ !! secondaryActions.length && (
				<DropdownMenu icon={ moreVertical } label={ __( 'Actions' ) }>
					{ () => (
						<MenuGroup>
							{ secondaryActions.map( ( action ) => {
								if ( !! action.RenderModal ) {
									return (
										<ActionWithModal
											key={ action.id }
											action={ action }
											item={ item }
											ActionTrigger={
												SecondaryActionTrigger
											}
										/>
									);
								}
								return (
									<SecondaryActionTrigger
										key={ action.id }
										action={ action }
										onClick={ () =>
											action.callback( item )
										}
									/>
								);
							} ) }
						</MenuGroup>
					) }
				</DropdownMenu>
			) }
		</HStack>
	);
}
