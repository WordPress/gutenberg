/**
 * External dependencies
 */
import type { MouseEventHandler, ReactElement } from 'react';

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
import genericForwardRef from '../../utils/generic-forward-ref';
import getActionLabel from '../../utils/get-action-label';

const { Menu, kebabCase } = unlock( componentsPrivateApis );

export interface ActionTriggerProps< Item > {
	action: Action< Item >;
	/**
	 * Click handler for direct usage. When the trigger is wrapped in a
	 * primitive that injects its own `onClick` via the render-prop pattern
	 * (e.g. `Dialog.Trigger render={ <ButtonTrigger … /> }`), the wrapper
	 * supplies the click handler and this prop should be omitted.
	 */
	onClick?: MouseEventHandler;
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
	/**
	 * Invoked when the user selects a modal action from the menu. The
	 * caller is expected to render a sibling `<Dialog.Root>` outside this
	 * menu that hosts the action's popup body — keeping the dialog out of
	 * the `Menu.Popover`'s `unmountOnHide` subtree so it survives the
	 * menu's exit transition.
	 */
	onModalAction: ( action: ActionModalType< Item > ) => void;
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

// `ButtonTrigger` forwards refs and unknown props onto its underlying
// `Button`, so it can be used directly (parent supplies `onClick`) or
// composed via render props
// (e.g. `<Dialog.Trigger render={ <ButtonTrigger … /> } />`).
const ButtonTrigger = genericForwardRef( function ButtonTrigger< Item >(
	{ action, items, variant, ...rest }: ActionTriggerProps< Item >,
	ref: React.Ref< HTMLButtonElement >
) {
	const label = getActionLabel( action, items );
	return (
		<Button
			ref={ ref }
			disabled={ !! action.disabled }
			accessibleWhenDisabled
			size="compact"
			variant={ variant }
			{ ...rest }
		>
			{ label }
		</Button>
	);
} );

// `MenuItemTrigger` is always rendered as a child of `<Menu.Popover>`
// and never composed under `<Dialog.Trigger>` — modal actions hoist
// their `Dialog.Root` outside the menu (see `ItemActionsMenu` below) so
// the `Menu.Item` only needs to fire its own `onClick`. No `forwardRef`,
// no `render` prop forwarding, no generic cast.
function MenuItemTrigger< Item >( {
	action,
	items,
	onClick,
}: {
	action: Action< Item >;
	items: Item[];
	onClick: () => void;
} ) {
	const label = getActionLabel( action, items );
	return (
		<Menu.Item disabled={ action.disabled } onClick={ onClick }>
			<Menu.ItemLabel>{ label }</Menu.ItemLabel>
		</Menu.Item>
	);
}

function mapModalSize(
	size: ActionModalType< unknown >[ 'modalSize' ]
): 'small' | 'medium' | 'large' | 'stretch' {
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

	const label = getActionLabel( action, items );
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

// Wraps a single modal action as an inline button that opens the
// action's dialog. The `Dialog.Root` lives at this call site (outside
// any host that unmounts on click — `Menu.Popover` is the relevant one
// in the menu path, see `ItemActionsMenu`) so its lifecycle is not
// affected by surrounding popover transitions.
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
	return (
		<Dialog.Root
			open={ open }
			onOpenChange={ setOpen }
			disablePointerDismissal={ action.hideModalHeader }
		>
			<Dialog.Trigger
				render={
					<ButtonTrigger
						action={ action }
						items={ items }
						variant={ variant }
					/>
				}
			/>
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
	onModalAction,
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
				onClick={
					'RenderModal' in action
						? () => onModalAction( action )
						: () => action.callback( [ item ], { registry } )
				}
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

// Hosts a kebab-style menu of item actions plus the `Dialog.Root` that
// owns the active modal action's popup body. The dialog is rendered as
// a sibling of `<Menu>` (not as a descendant of `Menu.Popover`) so it
// survives the menu's `unmountOnHide` exit transition. Both
// `CompactItemActions` and the list-layout's per-row menu use this
// component; they only differ in the trigger button passed in via
// `renderTrigger`.
export function ItemActionsMenu< Item >( {
	item,
	actions,
	registry,
	renderTrigger,
}: {
	item: Item;
	actions: Action< Item >[];
	registry: ReturnType< typeof useRegistry >;
	renderTrigger: ReactElement;
} ) {
	const [ activeModalAction, setActiveModalAction ] =
		useState< ActionModalType< Item > | null >( null );
	// Snapshot of the most recently active action — kept around so the
	// popup body stays mounted through the exit animation and is then
	// cleared from `onOpenChangeComplete` once the close transition
	// finishes (mirrors the `sessionKey` / defensive-setter patterns in
	// `PanelModal` and the page-templates duplicate dialog).
	const [ lastActiveModalAction, setLastActiveModalAction ] =
		useState< ActionModalType< Item > | null >( null );
	const renderedAction = activeModalAction ?? lastActiveModalAction;
	const closeModal = useCallback( () => setActiveModalAction( null ), [] );
	const onModalAction = useCallback( ( action: ActionModalType< Item > ) => {
		setActiveModalAction( action );
		setLastActiveModalAction( action );
	}, [] );

	return (
		<>
			<Menu placement="bottom-end">
				<Menu.TriggerButton render={ renderTrigger } />
				<Menu.Popover>
					<ActionsMenuGroup
						actions={ actions }
						item={ item }
						registry={ registry }
						onModalAction={ onModalAction }
					/>
				</Menu.Popover>
			</Menu>
			<Dialog.Root
				open={ activeModalAction !== null }
				onOpenChange={ ( open ) => {
					if ( ! open ) {
						setActiveModalAction( null );
					}
				} }
				onOpenChangeComplete={ ( open ) => {
					if ( ! open ) {
						setLastActiveModalAction( null );
					}
				} }
				disablePointerDismissal={ renderedAction?.hideModalHeader }
			>
				{ renderedAction && (
					// `key` per action.id force-remounts the popup body when
					// the user closes one action and opens a different one,
					// preventing the new action's `RenderModal` from
					// inheriting the previous session's state.
					<ActionModal
						key={ renderedAction.id }
						action={ renderedAction }
						items={ [ item ] }
						closeModal={ closeModal }
					/>
				) }
			</Dialog.Root>
		</>
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
		<ItemActionsMenu
			item={ item }
			actions={ actions }
			registry={ registry }
			renderTrigger={
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
