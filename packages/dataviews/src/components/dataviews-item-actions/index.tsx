/**
 * External dependencies
 */
import type { MouseEventHandler } from 'react';

/**
 * WordPress dependencies
 */
import {
	Button,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo, useRef, useState } from '@wordpress/element';
import { moreVertical } from '@wordpress/icons';
import { useRegistry } from '@wordpress/data';
import { useViewportMatch } from '@wordpress/compose';
import deprecated from '@wordpress/deprecated';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Dialog, Stack, VisuallyHidden } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import type { Action, ActionModal as ActionModalType } from '../../types';

const { Menu, kebabCase } = unlock( componentsPrivateApis );

export interface ActionTriggerProps< Item > {
	action: Action< Item >;
	onClick: MouseEventHandler;
	isBusy?: boolean;
	items: Item[];
	variant?: 'primary' | 'secondary' | 'tertiary' | 'link';
}

export interface ActionModalProps< Item > {
	action: ActionModalType< Item >;
	items: Item[];
	closeModal: () => void;
}

interface ActionsMenuGroupProps< Item > {
	actions: Action< Item >[];
	item: Item;
	registry: ReturnType< typeof useRegistry >;
	setActiveModalAction: ( action: ActionModalType< Item > | null ) => void;
}

interface ItemActionsProps< Item > {
	item: Item;
	actions: Action< Item >[];
	isCompact?: boolean;
}

interface CompactItemActionsProps< Item > {
	item: Item;
	actions: Action< Item >[];
	isSmall?: boolean;
	registry: ReturnType< typeof useRegistry >;
}

interface PrimaryActionsProps< Item > {
	item: Item;
	actions: Action< Item >[];
	registry: ReturnType< typeof useRegistry >;
	buttonVariant?: 'primary' | 'secondary' | 'tertiary' | 'link';
}

function ButtonTrigger< Item >( {
	action,
	onClick,
	items,
	variant,
}: ActionTriggerProps< Item > ) {
	const label =
		typeof action.label === 'string' ? action.label : action.label( items );
	return (
		<Button
			disabled={ !! action.disabled }
			accessibleWhenDisabled
			size="compact"
			variant={ variant }
			onClick={ onClick }
		>
			{ label }
		</Button>
	);
}

function MenuItemTrigger< Item >( {
	action,
	onClick,
	items,
}: ActionTriggerProps< Item > ) {
	const label =
		typeof action.label === 'string' ? action.label : action.label( items );
	return (
		<Menu.Item disabled={ action.disabled } onClick={ onClick }>
			<Menu.ItemLabel>{ label }</Menu.ItemLabel>
		</Menu.Item>
	);
}

function mapModalSize(
	size: ActionModalType< unknown >[ 'modalSize' ]
): 'small' | 'medium' | 'large' | 'stretch' | 'full' {
	if ( size === 'fill' ) {
		deprecated( "modalSize: 'fill'", {
			since: '7.8',
			alternative: "'stretch'",
		} );
		return 'stretch';
	}
	return (
		( size as 'small' | 'medium' | 'large' | 'stretch' | 'full' ) ??
		'medium'
	);
}

const FIRST_INPUT_SELECTOR =
	'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])';

function useMapFocusOnMount(
	focusOnMount: ActionModalType< unknown >[ 'modalFocusOnMount' ],
	contentRef: React.RefObject< HTMLElement | null >
) {
	const focusFirstInput = useCallback( () => {
		if ( contentRef.current ) {
			const target =
				contentRef.current.querySelector< HTMLElement >(
					FIRST_INPUT_SELECTOR
				);
			if ( target ) {
				return target;
			}
		}
		return true as const;
	}, [ contentRef ] );

	if ( focusOnMount === false ) {
		return false;
	}
	if ( focusOnMount === 'firstInputElement' ) {
		return focusFirstInput;
	}
	// 'firstContentElement', true, 'firstElement' — Dialog's smart default
	// already skips the close icon and focuses the first content tabbable.
	return true;
}

export function ActionModal< Item >( {
	action,
	items,
	closeModal,
}: ActionModalProps< Item > ) {
	const label =
		typeof action.label === 'string' ? action.label : action.label( items );

	const modalHeader =
		typeof action.modalHeader === 'function'
			? action.modalHeader( items )
			: action.modalHeader;

	const title = modalHeader || label;
	const contentRef = useRef< HTMLDivElement >( null );
	const initialFocus = useMapFocusOnMount(
		action.modalFocusOnMount ?? true,
		contentRef
	);

	return (
		<Dialog.Root
			open
			onOpenChange={ ( open ) => {
				if ( ! open ) {
					closeModal();
				}
			} }
			disablePointerDismissal={ action.hideModalHeader }
		>
			<Dialog.Popup
				size={ mapModalSize( action.modalSize ) }
				className={ `dataviews-action-modal dataviews-action-modal__${ kebabCase(
					action.id
				) }` }
				portal={
					<Dialog.Portal className="dataviews-action-modal-portal" />
				}
				initialFocus={ initialFocus }
				{ ...( action.hideModalHeader && {
					role: 'alertdialog' as const,
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
				<div ref={ contentRef }>
					<action.RenderModal
						items={ items }
						closeModal={ closeModal }
					/>
				</div>
			</Dialog.Popup>
		</Dialog.Root>
	);
}

export function ActionsMenuGroup< Item >( {
	actions,
	item,
	registry,
	setActiveModalAction,
}: ActionsMenuGroupProps< Item > ) {
	const { primaryActions, regularActions } = useMemo( () => {
		return actions.reduce(
			( acc, action ) => {
				( action.isPrimary
					? acc.primaryActions
					: acc.regularActions
				).push( action );
				return acc;
			},
			{
				primaryActions: [] as Action< Item >[],
				regularActions: [] as Action< Item >[],
			}
		);
	}, [ actions ] );

	const renderActionGroup = ( actionList: Action< Item >[] ) =>
		actionList.map( ( action ) => (
			<MenuItemTrigger
				key={ action.id }
				action={ action }
				onClick={ () => {
					if ( 'RenderModal' in action ) {
						setActiveModalAction( action );
						return;
					}
					action.callback( [ item ], { registry } );
				} }
				items={ [ item ] }
			/>
		) );

	return (
		<Menu.Group>
			{ renderActionGroup( primaryActions ) }
			{ renderActionGroup( regularActions ) }
		</Menu.Group>
	);
}

export default function ItemActions< Item >( {
	item,
	actions,
	isCompact,
}: ItemActionsProps< Item > ) {
	const registry = useRegistry();
	const { primaryActions, eligibleActions } = useMemo( () => {
		// If an action is eligible for all items, doesn't need
		// to provide the `isEligible` function.
		const _eligibleActions = actions.filter(
			( action ) => ! action.isEligible || action.isEligible( item )
		);
		const _primaryActions = _eligibleActions.filter(
			( action ) => action.isPrimary
		);
		return {
			primaryActions: _primaryActions,
			eligibleActions: _eligibleActions,
		};
	}, [ actions, item ] );

	const isMobileViewport = useViewportMatch( 'medium', '<' );

	if ( isCompact ) {
		return (
			<CompactItemActions
				item={ item }
				actions={ eligibleActions }
				isSmall
				registry={ registry }
			/>
		);
	}

	return (
		<Stack
			direction="row"
			justify="flex-end"
			className="dataviews-item-actions"
			style={ {
				flexShrink: 0,
				width: 'auto',
			} }
		>
			<PrimaryActions
				item={ item }
				actions={ primaryActions }
				registry={ registry }
			/>
			{ ( primaryActions.length < eligibleActions.length ||
				// Since we hide primary actions on mobile, we need to show the menu
				// there if there are any actions at all.
				isMobileViewport ) && (
				<CompactItemActions
					item={ item }
					actions={ eligibleActions }
					registry={ registry }
				/>
			) }
		</Stack>
	);
}

function CompactItemActions< Item >( {
	item,
	actions,
	isSmall,
	registry,
}: CompactItemActionsProps< Item > ) {
	const [ activeModalAction, setActiveModalAction ] = useState(
		null as ActionModalType< Item > | null
	);
	return (
		<>
			<Menu placement="bottom-end">
				<Menu.TriggerButton
					render={
						<Button
							size={ isSmall ? 'small' : 'compact' }
							icon={ moreVertical }
							label={ __( 'Actions' ) }
							accessibleWhenDisabled
							disabled={ ! actions.length }
							className="dataviews-all-actions-button"
						/>
					}
				/>
				<Menu.Popover>
					<ActionsMenuGroup
						actions={ actions }
						item={ item }
						registry={ registry }
						setActiveModalAction={ setActiveModalAction }
					/>
				</Menu.Popover>
			</Menu>
			{ !! activeModalAction && (
				<ActionModal
					action={ activeModalAction }
					items={ [ item ] }
					closeModal={ () => setActiveModalAction( null ) }
				/>
			) }
		</>
	);
}

export function PrimaryActions< Item >( {
	item,
	actions,
	registry,
	buttonVariant,
}: PrimaryActionsProps< Item > ) {
	const [ activeModalAction, setActiveModalAction ] = useState( null as any );
	const isMobileViewport = useViewportMatch( 'medium', '<' );

	if ( isMobileViewport ) {
		return null;
	}

	if ( ! Array.isArray( actions ) || actions.length === 0 ) {
		return null;
	}
	return (
		<>
			{ actions.map( ( action ) => (
				<ButtonTrigger
					key={ action.id }
					action={ action }
					onClick={ () => {
						if ( 'RenderModal' in action ) {
							setActiveModalAction( action );
							return;
						}
						action.callback( [ item ], { registry } );
					} }
					items={ [ item ] }
					variant={ buttonVariant }
				/>
			) ) }
			{ !! activeModalAction && (
				<ActionModal
					action={ activeModalAction }
					items={ [ item ] }
					closeModal={ () => setActiveModalAction( null ) }
				/>
			) }
		</>
	);
}
