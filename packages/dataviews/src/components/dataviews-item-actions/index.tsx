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
import { useMemo, useRef, useState } from '@wordpress/element';
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
	 * this `ActionModal` instance — the parent renders one `ActionModal` per
	 * modal action and toggles the `open` prop, rather than swapping the
	 * action on a single shared instance.
	 */
	action: ActionModalType< Item >;
	items: Item[];
	open: boolean;
	onOpenChange: ( open: boolean ) => void;
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
			since: '15.0.0',
			alternative: "'stretch'",
		} );
		return 'stretch';
	}
	return size ?? 'medium';
}

export function ActionModal< Item >( {
	action,
	items,
	open,
	onOpenChange,
}: ActionModalProps< Item > ) {
	// Each `ActionModal` instance owns one specific action for its lifetime,
	// so the popup contents never need to "remember" the previous action
	// through the exit animation: when the parent toggles `open` to `false`,
	// only the `open` prop changes — the `action` prop stays stable, the
	// popup unmounts asynchronously after Base UI's exit animation
	// completes, and there's no risk of rendering a stale or null action.
	const closeModal = () => onOpenChange( false );

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
		<Dialog.Root
			open={ open }
			// Wrap to drop Base UI's `eventDetails` second argument: callers
			// only need `(open: boolean) => void` and shouldn't depend on
			// Base UI internals leaking through.
			onOpenChange={ ( isOpen ) => onOpenChange( isOpen ) }
			disablePointerDismissal={ action.hideModalHeader }
		>
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
					<action.RenderModal
						items={ items }
						closeModal={ closeModal }
					/>
				</Dialog.Content>
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
	const modalActions = useMemo(
		() =>
			actions.filter(
				( action ): action is ActionModalType< Item > =>
					'RenderModal' in action
			),
		[ actions ]
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
			{ modalActions.map( ( action ) => (
				<ActionModal
					key={ action.id }
					action={ action }
					items={ [ item ] }
					open={ activeModalAction?.id === action.id }
					onOpenChange={ ( isOpen ) => {
						if ( ! isOpen ) {
							setActiveModalAction( null );
						}
					} }
				/>
			) ) }
		</>
	);
}

export function PrimaryActions< Item >( {
	item,
	actions,
	registry,
	buttonVariant,
}: PrimaryActionsProps< Item > ) {
	const [ activeModalAction, setActiveModalAction ] = useState(
		null as ActionModalType< Item > | null
	);
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const modalActions = useMemo(
		() =>
			Array.isArray( actions )
				? actions.filter(
						( action ): action is ActionModalType< Item > =>
							'RenderModal' in action
				  )
				: [],
		[ actions ]
	);

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
			{ modalActions.map( ( action ) => (
				<ActionModal
					key={ action.id }
					action={ action }
					items={ [ item ] }
					open={ activeModalAction?.id === action.id }
					onOpenChange={ ( isOpen ) => {
						if ( ! isOpen ) {
							setActiveModalAction( null );
						}
					} }
				/>
			) ) }
		</>
	);
}
