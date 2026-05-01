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
import useMapFocusOnMount from '../../hooks/use-map-focus-on-mount';

const { Menu, kebabCase } = unlock( componentsPrivateApis );

export interface ActionTriggerProps< Item > {
	action: Action< Item >;
	onClick: MouseEventHandler;
	isBusy?: boolean;
	items: Item[];
	variant?: 'primary' | 'secondary' | 'tertiary' | 'link';
}

export interface ActionModalProps< Item > {
	/**
	 * The action whose modal should be rendered. Stable for the lifetime of
	 * this `ActionModal` instance — the parent renders one `ActionModal`
	 * per modal action; opening/closing happens through the surrounding
	 * `<Dialog.Root>` (controlled or uncontrolled) rather than props on
	 * this component.
	 */
	action: ActionModalType< Item >;
	items: Item[];
	/**
	 * Imperative close callback exposed to the action's `RenderModal`
	 * implementation as `closeModal`. The wrapping component (e.g.
	 * `ModalActionMenuItem` / `ModalActionInlineButton`) owns the
	 * dialog's open state and supplies a setter that toggles it back to
	 * `false`. Public `RenderModalProps` consumers may call this from
	 * async code (e.g. after a network request) — that's why a callback
	 * is required even though the dialog's primitives can also close it.
	 */
	closeModal: () => void;
}

interface ActionsMenuGroupProps< Item > {
	actions: Action< Item >[];
	item: Item;
	registry: ReturnType< typeof useRegistry >;
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
			since: '15.0.0',
			alternative: "'stretch'",
		} );
		return 'stretch';
	}
	return size ?? 'medium';
}

// Renders the popup half of a dataviews action modal. Must be wrapped
// in a `<Dialog.Root>` that owns the open lifecycle (paired with
// `<Dialog.Trigger>` at the call site, e.g. `ModalActionMenuItem` or
// `ModalActionInlineButton`).
export function ActionModal< Item >( {
	action,
	items,
	closeModal,
}: ActionModalProps< Item > ) {
	const contentRef = useRef< HTMLDivElement >( null );
	const initialFocus = useMapFocusOnMount(
		action.modalFocusOnMount ?? true,
		contentRef
	);

	const label =
		typeof action.label === 'string' ? action.label : action.label( items );
	const modalHeader =
		typeof action.modalHeader === 'function'
			? action.modalHeader( items )
			: action.modalHeader;
	const title = modalHeader || label;

	return (
		<Dialog.Popup
			size={ mapModalSize( action.modalSize ) }
			className={ `dataviews-action-modal dataviews-action-modal__${ kebabCase(
				action.id
			) }` }
			portal={
				<Dialog.Portal className="dataviews-action-modal__portal" />
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
			<Dialog.Content ref={ contentRef }>
				<action.RenderModal items={ items } closeModal={ closeModal } />
			</Dialog.Content>
		</Dialog.Popup>
	);
}

// Wraps a single modal action as a menu item that opens the action's
// dialog. Owns the dialog's open state locally so each modal action is
// self-contained: the surrounding parent doesn't need a "which action is
// active" piece of state.
function ModalActionMenuItem< Item >( {
	action,
	items,
}: {
	action: ActionModalType< Item >;
	items: Item[];
} ) {
	const [ open, setOpen ] = useState( false );
	// Stable reference so consumer `RenderModal` implementations can pass
	// `closeModal` to event handlers / effects without remounting on every
	// keystroke.
	const closeModal = useCallback( () => setOpen( false ), [] );
	const label =
		typeof action.label === 'string' ? action.label : action.label( items );
	return (
		<Dialog.Root
			open={ open }
			onOpenChange={ setOpen }
			disablePointerDismissal={ action.hideModalHeader }
		>
			<Menu.Item
				disabled={ action.disabled }
				render={ <Dialog.Trigger /> }
			>
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

// Wraps a single modal action as an inline button that opens the
// action's dialog. Same self-contained-state contract as
// `ModalActionMenuItem`.
function ModalActionInlineButton< Item >( {
	action,
	items,
	variant,
}: {
	action: ActionModalType< Item >;
	items: Item[];
	variant?: 'primary' | 'secondary' | 'tertiary' | 'link';
} ) {
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
			<Dialog.Trigger
				render={
					<Button
						disabled={ !! action.disabled }
						accessibleWhenDisabled
						size="compact"
						variant={ variant }
					/>
				}
			>
				{ label }
			</Dialog.Trigger>
			<ActionModal
				action={ action }
				items={ items }
				closeModal={ closeModal }
			/>
		</Dialog.Root>
	);
}

export function ActionsMenuGroup< Item >( {
	actions,
	item,
	registry,
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
		actionList.map( ( action ) =>
			'RenderModal' in action ? (
				<ModalActionMenuItem
					key={ action.id }
					action={ action }
					items={ [ item ] }
				/>
			) : (
				<MenuItemTrigger
					key={ action.id }
					action={ action }
					onClick={ () => action.callback( [ item ], { registry } ) }
					items={ [ item ] }
				/>
			)
		);

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
	return (
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
				/>
			</Menu.Popover>
		</Menu>
	);
}

export function PrimaryActions< Item >( {
	item,
	actions,
	registry,
	buttonVariant,
}: PrimaryActionsProps< Item > ) {
	const isMobileViewport = useViewportMatch( 'medium', '<' );

	if ( isMobileViewport ) {
		return null;
	}

	if ( ! Array.isArray( actions ) || actions.length === 0 ) {
		return null;
	}
	return (
		<>
			{ actions.map( ( action ) =>
				'RenderModal' in action ? (
					<ModalActionInlineButton
						key={ action.id }
						action={ action }
						items={ [ item ] }
						variant={ buttonVariant }
					/>
				) : (
					<ButtonTrigger
						key={ action.id }
						action={ action }
						onClick={ () =>
							action.callback( [ item ], { registry } )
						}
						items={ [ item ] }
						variant={ buttonVariant }
					/>
				)
			) }
		</>
	);
}
