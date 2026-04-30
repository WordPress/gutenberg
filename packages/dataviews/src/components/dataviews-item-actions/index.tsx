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
	 * The action whose modal should be rendered. When `null`, the underlying
	 * `Dialog.Root` stays mounted with `open={ false }` so its exit animation
	 * can play; the popup contents are unmounted once the dialog has finished
	 * closing.
	 */
	action: ActionModalType< Item > | null;
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
	closeModal,
}: ActionModalProps< Item > ) {
	// Keep `Dialog.Root` always mounted in the React tree and toggle `open` so
	// Base UI sees the `false → true` transition and plays the entry animation.
	// `renderedAction` retains the last non-null action through the exit
	// animation; it's cleared once the dialog has finished closing via
	// `onOpenChangeComplete`.
	const [ renderedAction, setRenderedAction ] =
		useState< ActionModalType< Item > | null >( action );
	if ( action && action !== renderedAction ) {
		setRenderedAction( action );
	}
	const open = action !== null;

	const contentRef = useRef< HTMLDivElement >( null );
	const initialFocus = useMapFocusOnMount(
		renderedAction?.modalFocusOnMount ?? true,
		contentRef
	);

	const getLabel = () => {
		if ( ! renderedAction ) {
			return '';
		}
		return typeof renderedAction.label === 'string'
			? renderedAction.label
			: renderedAction.label( items );
	};
	const getModalHeader = () => {
		if ( ! renderedAction ) {
			return undefined;
		}
		return typeof renderedAction.modalHeader === 'function'
			? renderedAction.modalHeader( items )
			: renderedAction.modalHeader;
	};
	const title = getModalHeader() || getLabel();

	return (
		<Dialog.Root
			open={ open }
			onOpenChange={ ( isOpen ) => {
				if ( ! isOpen ) {
					closeModal();
				}
			} }
			onOpenChangeComplete={ ( isOpen ) => {
				if ( ! isOpen ) {
					setRenderedAction( null );
				}
			} }
			disablePointerDismissal={ renderedAction?.hideModalHeader }
		>
			{ renderedAction && (
				<Dialog.Popup
					size={ mapModalSize( renderedAction.modalSize ) }
					className={ `dataviews-action-modal dataviews-action-modal__${ kebabCase(
						renderedAction.id
					) }` }
					portal={
						<Dialog.Portal className="dataviews-action-modal__portal" />
					}
					initialFocus={ initialFocus }
					{ ...( renderedAction.hideModalHeader && {
						role: 'alertdialog' as const,
					} ) }
				>
					{ renderedAction.hideModalHeader ? (
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
						<renderedAction.RenderModal
							items={ items }
							closeModal={ closeModal }
						/>
					</Dialog.Content>
				</Dialog.Popup>
			) }
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
			<ActionModal
				action={ activeModalAction }
				items={ [ item ] }
				closeModal={ () => setActiveModalAction( null ) }
			/>
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
			<ActionModal
				action={ activeModalAction }
				items={ [ item ] }
				closeModal={ () => setActiveModalAction( null ) }
			/>
		</>
	);
}
