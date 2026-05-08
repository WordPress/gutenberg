/**
 * WordPress dependencies
 */
import { useRegistry, useSelect } from '@wordpress/data';
import {
	forwardRef,
	useCallback,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	privateApis as componentsPrivateApis,
	Button,
} from '@wordpress/components';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Dialog, VisuallyHidden } from '@wordpress/ui';
import { moreVertical } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { usePostActions } from './actions';

const { Menu, kebabCase } = unlock( componentsPrivateApis );

const FIRST_INPUT_SELECTOR =
	'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])';

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

// The remaining helpers in this file (`DropdownMenuItemTrigger`,
// `ModalActionMenuItem`, `ActionModal`, `ActionsDropdownMenuGroup`,
// `mapModalSize`, `useMapFocusOnMount`) are intentionally duplicated from
// `@wordpress/dataviews` (`packages/dataviews/src/components/dataviews-item-actions/`
// and `packages/dataviews/src/hooks/use-map-focus-on-mount.ts`). The editor
// package can't depend on dataviews and dataviews can't depend on the editor,
// so duplication is the least-bad option until the action-modal API is
// extracted to a neutral package — a tracked follow-up on the parent PR.

// Forwards `ref` and unknown props onto `Menu.Item`, so the same
// component works both as a direct callable (parent supplies `onClick`)
// and as the body of a render-prop composition (e.g.
// `<DropdownMenuItemTrigger render={ <Dialog.Trigger /> } />`). Mirrors
// dataviews' `MenuItemTrigger`.
const DropdownMenuItemTrigger = forwardRef(
	( { action, items, render, ...rest }, ref ) => {
		const label =
			typeof action.label === 'string'
				? action.label
				: action.label( items );
		return (
			<Menu.Item
				ref={ ref }
				disabled={ action.disabled }
				render={ render }
				{ ...rest }
			>
				<Menu.ItemLabel>{ label }</Menu.ItemLabel>
			</Menu.Item>
		);
	}
);

// Wraps a single modal action as a menu item that opens the action's
// dialog. Owns the dialog's open state locally so each modal action is
// self-contained: the surrounding parent doesn't need a "which action is
// active" piece of state. Mirrors `ModalActionMenuItem` in
// `@wordpress/dataviews`.
function ModalActionMenuItem( { action, items } ) {
	const [ open, setOpen ] = useState( false );
	const closeModal = useCallback( () => setOpen( false ), [] );
	return (
		<Dialog.Root
			open={ open }
			onOpenChange={ setOpen }
			disablePointerDismissal={ action.hideModalHeader }
		>
			<DropdownMenuItemTrigger
				action={ action }
				items={ items }
				render={ <Dialog.Trigger /> }
			/>
			<ActionModal
				action={ action }
				items={ items }
				closeModal={ closeModal }
			/>
		</Dialog.Root>
	);
}

// Mirrors `mapModalSize` in `@wordpress/dataviews` — translates the public
// `action.modalSize` value (including the deprecated `'fill'`) into the
// `Dialog.Popup` size prop.
function mapModalSize( size ) {
	if ( size === 'fill' ) {
		deprecated( "modalSize: 'fill'", {
			since: '15.0.0',
			alternative: "'stretch'",
		} );
		return 'stretch';
	}
	return size ?? 'medium';
}

// Mirrors `useMapFocusOnMount` in `@wordpress/dataviews` — translates the
// legacy `action.modalFocusOnMount` values onto Base UI's `initialFocus`
// prop. Smart-default behavior (skip the close icon, focus the first
// content tabbable) covers `'firstElement'` and `'firstContentElement'`;
// `'firstInputElement'` resolves to the first focusable input/select/textarea
// inside `contentRef`.
function useMapFocusOnMount( focusOnMount, contentRef ) {
	const focusFirstInput = useCallback( () => {
		if ( contentRef.current ) {
			const target =
				contentRef.current.querySelector( FIRST_INPUT_SELECTOR );
			if ( target ) {
				return target;
			}
		}
		return true;
	}, [ contentRef ] );

	if ( focusOnMount === false ) {
		return false;
	}
	if ( focusOnMount === 'firstInputElement' ) {
		return focusFirstInput;
	}
	return true;
}

// Renders the popup half of a post-actions modal. Must be wrapped in a
// `<Dialog.Root>` that owns the open lifecycle (paired with
// `<Dialog.Trigger>` at the call site, e.g. `ModalActionMenuItem`).
//
// Mirrors `ActionModal` in `@wordpress/dataviews` — see comment block
// above `DropdownMenuItemTrigger` for the duplication rationale.
export function ActionModal( { action, items, closeModal } ) {
	const contentRef = useRef( null );
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
			className={ `editor-action-modal editor-action-modal__${ kebabCase(
				action.id
			) }` }
			portal={ <Dialog.Portal className="editor-action-modal__portal" /> }
			initialFocus={ initialFocus }
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
			<Dialog.Content ref={ contentRef }>
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
