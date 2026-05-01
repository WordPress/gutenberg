/**
 * WordPress dependencies
 */
import { useRegistry, useSelect } from '@wordpress/data';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	privateApis as componentsPrivateApis,
	Button,
} from '@wordpress/components';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Dialog, VisuallyHidden } from '@wordpress/ui';
import { moreVertical } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { usePostActions } from './actions';

const { Menu, kebabCase } = unlock( componentsPrivateApis );

export default function PostActions( { postType, postId, onActionPerformed } ) {
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
				/>
			</Menu.Popover>
		</Menu>
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

// Wraps a single modal action as a menu item that opens the action's
// dialog. Owns the dialog's open state locally so each modal action is
// self-contained: the surrounding parent doesn't need a "which action is
// active" piece of state. Mirrors `ModalActionMenuItem` in
// `@wordpress/dataviews`.
function ModalActionMenuItem( { action, items } ) {
	const [ open, setOpen ] = useState( false );
	const closeModal = useCallback( () => setOpen( false ), [] );
	const label =
		typeof action.label === 'string' ? action.label : action.label( items );
	return (
		<Dialog.Root
			open={ open }
			onOpenChange={ setOpen }
			disablePointerDismissal={ action.hideModalHeader }
		>
			<Menu.Item render={ <Dialog.Trigger /> }>
				<Menu.ItemLabel>{ label }</Menu.ItemLabel>
			</Menu.Item>
			<ActionModal
				action={ action }
				items={ items }
				closeModal={ closeModal }
			/>
		</Dialog.Root>
	);
}

// Renders the popup half of a post-actions modal. Must be wrapped in a
// `<Dialog.Root>` that owns the open lifecycle (paired with
// `<Dialog.Trigger>` at the call site, e.g. `ModalActionMenuItem`).
export function ActionModal( { action, items, closeModal } ) {
	const label =
		typeof action.label === 'string' ? action.label : action.label( items );
	const modalHeader =
		typeof action.modalHeader === 'function'
			? action.modalHeader( items )
			: action.modalHeader;
	const title = modalHeader || label;
	return (
		<Dialog.Popup
			size="medium"
			className={ `editor-action-modal editor-action-modal__${ kebabCase(
				action.id
			) }` }
			portal={ <Dialog.Portal className="editor-action-modal__portal" /> }
			{ ...( action.hideModalHeader && {
				role: 'alertdialog',
			} ) }
		>
			{ action.hideModalHeader ? (
				<VisuallyHidden
					render={ <Dialog.Title>{ title }</Dialog.Title> }
				/>
			) : (
				<Dialog.Header>
					<Dialog.Title>{ title }</Dialog.Title>
					<Dialog.CloseIcon />
				</Dialog.Header>
			) }
			<Dialog.Content>
				<action.RenderModal items={ items } closeModal={ closeModal } />
			</Dialog.Content>
		</Dialog.Popup>
	);
}

function ActionsDropdownMenuGroup( { actions, items } ) {
	const registry = useRegistry();
	return (
		<Menu.Group>
			{ actions.map( ( action ) => {
				if ( 'RenderModal' in action ) {
					return (
						<ModalActionMenuItem
							key={ action.id }
							action={ action }
							items={ items }
						/>
					);
				}
				return (
					<DropdownMenuItemTrigger
						key={ action.id }
						action={ action }
						onClick={ () => {
							action.callback( items, { registry } );
						} }
						items={ items }
					/>
				);
			} ) }
		</Menu.Group>
	);
}
