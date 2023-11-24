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
import { useMemo, useState, Fragment, Children } from '@wordpress/element';
import { moreVertical, Icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuGroupV2: DropdownMenuGroup,
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuSeparatorV2: DropdownMenuSeparator,
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
		<DropdownMenuItem
			onClick={ onClick }
			prefix={
				action.isPrimary && action.icon && <Icon icon={ action.icon } />
			}
		>
			{ action.label }
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

export default function ItemActions( { item, actions, viewType } ) {
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
	if ( viewType === 'grid' ) {
		return (
			<GridItemActions
				item={ item }
				primaryActions={ primaryActions }
				secondaryActions={ secondaryActions }
			/>
		);
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
							variant="tertiary"
							size="compact"
							icon={ moreVertical }
							label={ __( 'Actions' ) }
						/>
					}
					align="start"
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

function WithSeparators( { children } ) {
	return Children.toArray( children )
		.filter( Boolean )
		.map( ( child, i ) => (
			<Fragment key={ i }>
				{ i > 0 && <DropdownMenuSeparator /> }
				{ child }
			</Fragment>
		) );
}

function GridItemActions( { item, primaryActions, secondaryActions } ) {
	return (
		<DropdownMenu
			trigger={
				<Button
					variant="tertiary"
					size="compact"
					icon={ moreVertical }
					label={ __( 'Actions' ) }
				/>
			}
			align="start"
		>
			<WithSeparators>
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
			</WithSeparators>
		</DropdownMenu>
	);
}
