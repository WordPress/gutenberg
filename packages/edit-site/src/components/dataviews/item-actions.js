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
import { forwardRef, useMemo, useState } from '@wordpress/element';
import { moreVertical } from '@wordpress/icons';

const PrimaryActionTrigger = forwardRef( ( { action, ...props }, ref ) => (
	<Button
		ref={ ref }
		label={ action.label }
		icon={ action.icon }
		isDestructive={ action.isDestructive }
		size="compact"
		{ ...props }
	/>
) );

const SecondaryActionTrigger = forwardRef( ( { action, ...props }, ref ) => (
	<MenuItem ref={ ref } isDestructive={ action.isDestructive } { ...props }>
		{ action.label }
	</MenuItem>
) );

function ActionWithModal( { action, item, ActionTrigger, ...props } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const actionTriggerProps = {
		action,
		onClick: () => setIsModalOpen( true ),
		...props,
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

const WidgetTrigger = forwardRef( ( { Widget, Trigger, ...props }, ref ) => {
	if ( Widget ) {
		return <Widget ref={ ref } { ...props } render={ <Trigger /> } />;
	}

	return <Trigger ref={ ref } { ...props } />;
} );

export default function ItemActions( { item, actions, Widget } ) {
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
								ActionTrigger={ WidgetTrigger }
								Widget={ Widget }
								Trigger={ PrimaryActionTrigger }
							/>
						);
					}
					return (
						<WidgetTrigger
							key={ action.id }
							action={ action }
							onClick={ () => action.callback( item ) }
							Widget={ Widget }
							Trigger={ PrimaryActionTrigger }
						/>
					);
				} ) }
			{ !! secondaryActions.length && (
				<DropdownMenu
					toggleProps={ {
						as: ( props ) =>
							Widget ? (
								<Widget { ...props } render={ <Button /> } />
							) : (
								<Button { ...props } />
							),
					} }
					icon={ moreVertical }
					label={ __( 'Actions' ) }
				>
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
										item={ item }
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
