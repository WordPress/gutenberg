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

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import {
	viewPostAction,
	postRevisionsAction,
	renamePostAction,
	trashPostAction,
} from './actions';
import { store as editorStore } from '../../store';
import {
	TEMPLATE_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
	PATTERN_POST_TYPE,
} from '../../store/constants';

const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuGroupV2: DropdownMenuGroup,
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuItemLabelV2: DropdownMenuItemLabel,
	kebabCase,
} = unlock( componentsPrivateApis );

export default function PostActions( { onActionPerformed, buttonProps } ) {
	const { postType, item } = useSelect( ( select ) => {
		const { getCurrentPostType, getCurrentPost } = select( editorStore );
		return {
			postType: getCurrentPostType(),
			item: getCurrentPost(),
		};
	} );

	const actions = useMemo( () => {
		const eligibleActions = [
			viewPostAction,
			postRevisionsAction,
			renamePostAction,
			trashPostAction,
		].filter( ( action ) => {
			return ! action.isEligible || action.isEligible( item );
		} );
		return eligibleActions.map( ( action ) => {
			return {
				...action,
				onActionPerformed: ( ...args ) => {
					onActionPerformed?.( action.id, ...args );
					action.onActionPerformed?.( ...args );
				},
			};
		} );
	}, [ item, onActionPerformed ] );

	if (
		[
			TEMPLATE_POST_TYPE,
			TEMPLATE_PART_POST_TYPE,
			PATTERN_POST_TYPE,
		].includes( postType )
	) {
		return null;
	}
	return (
		<DropdownMenu
			trigger={
				<Button
					size="small"
					icon={ moreVertical }
					label={ __( 'Actions' ) }
					disabled={ ! actions.length }
					className="editor-all-actions-button"
					{ ...buttonProps }
				/>
			}
			placement="bottom-end"
		>
			<ActionsDropdownMenuGroup actions={ actions } item={ item } />
		</DropdownMenu>
	);
}

// From now on all the functions on this file are copied as from the dataviews packages,
// The editor packages should not be using the dataviews packages directly,
// and the dataviews package should not be using the editor packages directly,
// so duplicating the code here seems like the least bad option.

// Copied as is from packages/dataviews/src/item-actions.js
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

// Copied as is from packages/dataviews/src/item-actions.js
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
					overlayClassName={ `editor-action-modal editor-action-modal__${ kebabCase(
						action.id
					) }` }
				>
					<RenderModal
						items={ [ item ] }
						closeModal={ () => setIsModalOpen( false ) }
						action={ action }
					/>
				</Modal>
			) }
		</>
	);
}

// Copied as is from packages/dataviews/src/item-actions.js
function ActionsDropdownMenuGroup( { actions, item } ) {
	const registry = useRegistry();
	return (
		<DropdownMenuGroup>
			{ actions.map( ( action ) => {
				if ( action.RenderModal ) {
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
						onClick={ async () => {
							const returnResult = await action.callback( [
								item,
							] );
							if ( typeof returnResult === 'function' ) {
								await returnResult( {
									registry,
									select: registry.select,
									dispatch: registry.dispatch,
								} );
							}
						} }
					/>
				);
			} ) }
		</DropdownMenuGroup>
	);
}
