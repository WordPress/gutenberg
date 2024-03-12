/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useState, Children, Fragment, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	privateApis as componentsPrivateApis,
	Modal,
	Button,
} from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import {
	trashPostAction,
	usePermanentlyDeletePostAction,
	useRestorePostAction,
	postRevisionsAction,
} from './actions';

const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuGroupV2: DropdownMenuGroup,
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuItemLabelV2: DropdownMenuItemLabel,
	DropdownMenuSeparatorV2: DropdownMenuSeparator,
	kebabCase,
} = unlock( componentsPrivateApis );

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
					title={ action.modalHeader || action.label }
					__experimentalHideHeader={ !! hideModalHeader }
					onRequestClose={ () => {
						setIsModalOpen( false );
					} }
					overlayClassName={ `dataviews-action-modal dataviews-action-modal__${ kebabCase(
						action.id
					) }` }
				>
					<RenderModal
						items={ [ item ] }
						closeModal={ () => setIsModalOpen( false ) }
					/>
				</Modal>
			) }
		</>
	);
}

function WithDropDownMenuSeparators( { children } ) {
	return Children.toArray( children )
		.filter( Boolean )
		.map( ( child, i ) => (
			<Fragment key={ i }>
				{ i > 0 && <DropdownMenuSeparator /> }
				{ child }
			</Fragment>
		) );
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
						onClick={ () => action.callback( [ item ] ) }
					/>
				);
			} ) }
		</DropdownMenuGroup>
	);
}

export default function PostActions( { postType, postId } ) {
	const item = useSelect(
		( select ) => {
			const { getEditedEntityRecord } = select( coreStore );
			return getEditedEntityRecord( 'postType', postType, postId );
		},
		[ postType, postId ]
	);
	const permanentlyDeletePostAction = usePermanentlyDeletePostAction();
	const restorePostAction = useRestorePostAction();

	const { primaryActions, secondaryActions } = useMemo( () => {
		const actions = [
			trashPostAction,
			permanentlyDeletePostAction,
			restorePostAction,
			postRevisionsAction,
		];
		return actions.reduce(
			( accumulator, action ) => {
				if ( action.isEligible && ! action.isEligible( item ) ) {
					return accumulator;
				}
				if ( action.isPrimary ) {
					accumulator.primaryActions.push( action );
				} else {
					accumulator.secondaryActions.push( action );
				}
				return accumulator;
			},
			{ primaryActions: [], secondaryActions: [] }
		);
	}, [ permanentlyDeletePostAction, restorePostAction, item ] );
	return (
		<DropdownMenu
			trigger={
				<Button
					size="compact"
					icon={ moreVertical }
					label={ __( 'Actions' ) }
					disabled={
						! primaryActions.length && ! secondaryActions.length
					}
					className="dataviews-all-actions-button"
				/>
			}
			placement="bottom-end"
		>
			<WithDropDownMenuSeparators>
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
			</WithDropDownMenuSeparators>
		</DropdownMenu>
	);
}
