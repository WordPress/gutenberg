/**
 * WordPress dependencies
 */
import { useRegistry, useSelect } from '@wordpress/data';
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

const { Menu, kebabCase } = unlock( componentsPrivateApis );

export default function PostActions( { postType, postId, onActionPerformed } ) {
	const [ activeModalAction, setActiveModalAction ] = useState( null );

	const { item, permissions } = useSelect(
		( select ) => {
			const { getEditedEntityRecord, getEntityRecordPermissions } =
				unlock( select( coreStore ) );
			return {
				item: getEditedEntityRecord( 'postType', postType, postId ),
				permissions: getEntityRecordPermissions(
					'postType',
					postType,
					postId
				),
			};
		},
		[ postId, postType ]
	);
	const itemWithPermissions = useMemo( () => {
		return {
			...item,
			permissions,
		};
	}, [ item, permissions ] );
	const allActions = usePostActions( { postType, onActionPerformed } );

	const actions = useMemo( () => {
		return allActions.filter( ( action ) => {
			return (
				! action.isEligible || action.isEligible( itemWithPermissions )
			);
		} );
	}, [ allActions, itemWithPermissions ] );

	return (
		<>
			<Menu placement="bottom-end">
				<Menu.TriggerButton
					render={
						<Button
							size="small"
							icon={ moreVertical }
							label={ __( 'Actions' ) }
							disabled={ ! actions.length }
							accessibleWhenDisabled
							className="editor-all-actions-button"
						/>
					}
				/>
				<Menu.Popover>
					<ActionsDropdownMenuGroup
						actions={ actions }
						items={ [ itemWithPermissions ] }
						setActiveModalAction={ setActiveModalAction }
					/>
				</Menu.Popover>
			</Menu>
			{ !! activeModalAction && (
				<ActionModal
					action={ activeModalAction }
					items={ [ itemWithPermissions ] }
					closeModal={ () => setActiveModalAction( null ) }
				/>
			) }
		</>
	);
}

// From now on all the functions on this file are copied as from the dataviews packages,
// The editor packages should not be using the dataviews packages directly,
// and the dataviews package should not be using the editor packages directly,
// so duplicating the code here seems like the least bad option.

function DropdownMenuItemTrigger( { action, onClick, items } ) {
	const label =
		typeof action.label === 'string' ? action.label : action.label( items );
	return (
		<Menu.Item onClick={ onClick }>
			<Menu.ItemLabel>{ label }</Menu.ItemLabel>
		</Menu.Item>
	);
}

export function ActionModal( { action, items, closeModal } ) {
	const label =
		typeof action.label === 'string' ? action.label : action.label( items );
	return (
		<Modal
			title={ action.modalHeader || label }
			__experimentalHideHeader={ !! action.hideModalHeader }
			onRequestClose={ closeModal ?? ( () => {} ) }
			focusOnMount="firstContentElement"
			size="medium"
			overlayClassName={ `editor-action-modal editor-action-modal__${ kebabCase(
				action.id
			) }` }
		>
			<action.RenderModal items={ items } closeModal={ closeModal } />
		</Modal>
	);
}

function ActionsDropdownMenuGroup( { actions, items, setActiveModalAction } ) {
	const registry = useRegistry();
	return (
		<Menu.Group>
			{ actions.map( ( action ) => {
				return (
					<DropdownMenuItemTrigger
						key={ action.id }
						action={ action }
						onClick={ () => {
							if ( 'RenderModal' in action ) {
								setActiveModalAction( action );
								return;
							}
							action.callback( items, { registry } );
						} }
						items={ items }
					/>
				);
			} ) }
		</Menu.Group>
	);
}
