/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useState, Children, Fragment, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	MenuGroup,
	MenuItem,
	__experimentalConfirmDialog as ConfirmDialog,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import isTemplateRemovable from '../../utils/is-template-removable';
import isTemplateRevertable from '../../utils/is-template-revertable';
import RenameMenuItem from './rename-menu-item';
import { TEMPLATE_POST_TYPE } from '../../utils/constants';
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
	kebabCase,
} = unlock( componentsPrivateApis );

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

export default function PostActions( { className, postType, postId } ) {
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
				if ( action.isPrimary ) {
					accumulator.primaryActions.push( action );
				} else {
					accumulator.secondaryActions.push( action );
				}
				return accumulator;
			},
			{ primaryActions: [], secondaryActions: [] }
		);
	}, [ permanentlyDeletePostAction, restorePostAction ] );
	return (
		<DropdownMenu
			icon={ moreVertical }
			label={ __( 'Actions' ) }
			className={ className }
			toggleProps={ { size: 'small' } }
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
