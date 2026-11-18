import { store as blockEditorStore } from '@wordpress/block-editor';
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	NavigableMenu,
	Popover as WCPopover,
} from '@wordpress/components';
import { useMergeRefs, useRefEffect } from '@wordpress/compose';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { forwardRef, useRef, useState } from '@wordpress/element';
import type { Block } from '@wordpress/blocks';
import type { ComponentProps, FocusEventHandler, ForwardedRef } from 'react';
import { escapeHTML } from '@wordpress/escape-html';
import { __ } from '@wordpress/i18n';
import {
	addSubmenu,
	chevronLeft,
	link,
	page,
	plus,
	postCategories,
} from '@wordpress/icons';
import BulkAddModal from './bulk-add-modal';
import SubmenuLabelPopover from './submenu-label-popover';
import SubmenuTypeMenuGroup from './submenu-type-menu-group';
import NavigationMenuListStyles from './appender-list-styles';
import { convertToSubmenu, whenRendered } from './create-submenu';
import { setSubmenuRequest, useSubmenuRequest } from './submenu-request';
import type { SubmenuType } from './submenu-type-menu-group';
import {
	createCustomLinkBlock,
	createCustomLinkSubmenuBlock,
	createLabelOnlySubmenuBlock,
	createPageLinkBlock,
	createPageSubmenuBlock,
} from './appender-blocks';

// Inline, because block-library's editor styles are not loaded on every
// surface that shows the menu list view (the extensible site editor).
const APPENDER_INDENT = 24;
// Sits beside the add button, which the list view's styles give a top margin.
const EMPTY_STATE_STYLE = {
	margin: 0,
	marginBlockStart: 'var(--wpds-dimension-gap-sm, 8px)',
	paddingInlineStart: 'var(--wpds-dimension-gap-sm, 8px)',
	fontSize: 12,
	color: 'var(--wpds-color-foreground-content-neutral-weak, #757575)',
};

// Let the dropdown close and return focus to its toggle before the next UI
// (the link popover or the label popover) takes focus.
function afterDropdownCloses( callback: () => void ) {
	window.requestAnimationFrame( callback );
}

/**
 * Mirrors `ListViewRenderAppenderProps` in
 * `packages/block-editor/src/components/list-view/types.ts`, which isn't
 * exported.
 */
export interface NavigationMenuAppenderProps {
	/** Client id of the block to add items into. */
	clientId: string;
	/** Nesting level of the appender row. */
	nestingLevel?: number;
	/** Number of items in the parent. */
	blockCount: number;
	/** Id of the appender's description. */
	descriptionId: string;
	/** Opens the link popover for a new item. */
	setInsertedBlockClientId: ( clientId: string ) => void;
	/** Tree grid tab index for the toggle. */
	tabIndex?: number;
	/** Tree grid focus handler for the toggle. */
	onFocus?: FocusEventHandler;
}

/**
 * The task-based appender for a Navigation Menu list view (#86177), used at
 * the top level and inside the sub menu being worked on (#86178).
 *
 * Offers the same tasks, in the same order, as the Create Not Learn prototype:
 * add an existing page, a custom link or a submenu, or more. Each task inserts
 * an existing block and, where it needs a link, opens the list view's link
 * popover for the new item.
 *
 * Receives the props documented as `ListViewRenderAppenderProps` in
 * `packages/block-editor/src/components/list-view/types.ts`.
 *
 * @param props                          Appender props from `PrivateListView`.
 * @param props.clientId                 Client id of the block to add items into.
 * @param props.nestingLevel             Nesting level of the appender row.
 * @param props.blockCount               Number of items in the parent.
 * @param props.descriptionId            Id of the appender's description.
 * @param props.setInsertedBlockClientId Opens the link popover for a new item.
 * @param props.tabIndex                 Tree grid tab index for the toggle.
 * @param props.onFocus                  Tree grid focus handler for the toggle.
 * @param ref                            Ref for the focusable toggle.
 */
function NavigationMenuAppender(
	{
		clientId,
		nestingLevel = 1,
		blockCount,
		descriptionId,
		setInsertedBlockClientId,
		tabIndex,
		onFocus,
	}: NavigationMenuAppenderProps,
	ref: ForwardedRef< HTMLElement >
) {
	const [ isChoosingSubmenuType, setIsChoosingSubmenuType ] =
		useState( false );
	const [ isAddingMore, setIsAddingMore ] = useState( false );
	// Asking for a new label-only submenu's label.
	const [ isAddingLabelOnly, setIsAddingLabelOnly ] = useState( false );
	// Kept in state, as it anchors the label popover.
	const [ toggleElement, setToggleElement ] = useState< HTMLElement | null >(
		null
	);
	const mergedToggleRef = useMergeRefs( [ ref, setToggleElement ] );
	// The appender row has one cell. Span the row, so the row reads as one
	// with the rows above it, and a sub menu's tint reaches the edge.
	const cellRef = useRefEffect< HTMLDivElement >( ( node ) => {
		const cell = node.closest( 'td' );
		if ( cell ) {
			cell.colSpan = 3;
		}
	}, [] );

	// Moves focus into the menu when switching between its two steps, as the
	// item that had focus is gone.
	const stepFocusRef = useRef< HTMLButtonElement >( null );
	const switchStep = ( isSubmenuStep: boolean ) => {
		setIsChoosingSubmenuType( isSubmenuStep );
		window.requestAnimationFrame( () => stepFocusRef.current?.focus() );
	};

	const { insertBlock } = useDispatch( blockEditorStore );
	const registry = useRegistry();
	// "Create submenu" in an item's options menu carries on here (see
	// `submenu-request`), as only the top-level add button is sure to be
	// around.
	const submenuRequest = useSubmenuRequest();
	const { getBlockCount } = useSelect( blockEditorStore );

	const { isSubmenu, canInsertLink, canInsertSubmenu } = useSelect(
		( select ) => {
			const { getBlockName, canInsertBlockType } =
				select( blockEditorStore );
			return {
				isSubmenu:
					getBlockName( clientId ) === 'core/navigation-submenu',
				canInsertLink: canInsertBlockType(
					'core/navigation-link',
					clientId
				),
				canInsertSubmenu: canInsertBlockType(
					'core/navigation-submenu',
					clientId
				),
			};
		},
		[ clientId ]
	);

	const submenuRequestRow =
		! isSubmenu && submenuRequest
			? toggleElement?.ownerDocument.querySelector(
					`.block-editor-list-view-leaf[data-block="${ submenuRequest.clientId }"]`
				)
			: null;
	const finishSubmenuRequest = (
		type: SubmenuType,
		submenuLabel?: string
	) => {
		setSubmenuRequest( null );
		convertToSubmenu( {
			clientId: submenuRequest!.clientId,
			type,
			label: submenuLabel,
			registry,
			updateExpansion: submenuRequest!.updateExpansion,
			setInsertedBlockClientId,
		} );
	};
	const cancelSubmenuRequest = () => {
		setSubmenuRequest( null );
		submenuRequestRow
			?.querySelector< HTMLElement >(
				'.block-editor-list-view-block__menu'
			)
			?.focus();
	};

	if ( ! canInsertLink && ! canInsertSubmenu ) {
		return null;
	}

	const focusToggle = () => toggleElement?.focus();

	// By default the selection doesn't change after adding, so this works the
	// same everywhere, including the inspector, where selecting moves away
	// from the list, and a submenu being worked on keeps its add button.
	const insertItem = (
		block: Block,
		{ openLinkUI = true, updateSelection = false } = {}
	) => {
		insertBlock(
			block,
			getBlockCount( clientId ),
			clientId,
			updateSelection
		);
		if ( openLinkUI ) {
			setInsertedBlockClientId( block.clientId );
		}
	};

	const saveLabelOnly = ( submenuLabel: string ) => {
		// Look things up from the document, as adding a submenu can unmount
		// this appender (a submenu that's no longer empty loses its own).
		const doc = toggleElement?.ownerDocument;
		const submenu = createLabelOnlySubmenuBlock(
			escapeHTML( submenuLabel )
		);
		setIsAddingLabelOnly( false );
		// Only the selected submenu shows its add button, so select the new
		// one, and the next step is adding its items. Not in the Navigation
		// block's inspector, where selecting moves away from the list.
		const isInInspector = !! toggleElement?.closest(
			'.block-editor-block-inspector'
		);
		insertItem( submenu, {
			openLinkUI: false,
			updateSelection: ! isInInspector,
		} );
		if ( isInInspector ) {
			focusToggle();
			return;
		}
		// Move to the new submenu's own add button.
		whenRendered(
			() =>
				doc?.querySelector< HTMLElement >(
					`[data-navigation-menu-appender-for="${ submenu.clientId }"] .navigation-menu-appender__toggle`
				),
			( element ) => element.focus()
		);
	};

	const label = isSubmenu ? __( 'Add to submenu' ) : __( 'Add menu item' );
	const isEmptySubmenu = isSubmenu && blockCount === 0;

	const dropdown = (
		<DropdownMenu
			// Inside a submenu, the button uses the Submenu block's own icon,
			// whose arrow points inwards, so it reads as "add into this
			// submenu" rather than the "+" that adds to the whole menu.
			icon={ isSubmenu ? addSubmenu : plus }
			label={ label }
			onToggle={ ( isOpen ) => {
				if ( ! isOpen ) {
					setIsChoosingSubmenuType( false );
				}
			} }
			popoverProps={ { placement: 'bottom-start' } }
			toggleProps={
				{
					ref: mergedToggleRef,
					tabIndex,
					onFocus,
					'aria-describedby': descriptionId,
					className:
						'block-editor-inserter__toggle navigation-menu-appender__toggle',
					__next40pxDefaultSize: true,
					// `ToggleProps` leaves out `ref`, but the toggle receives it.
				} as ComponentProps< typeof DropdownMenu >[ 'toggleProps' ]
			}
		>
			{ ( { onClose } ) => {
				const runTask = ( task: () => void ) => () => {
					onClose();
					setIsChoosingSubmenuType( false );
					afterDropdownCloses( task );
				};

				if ( isChoosingSubmenuType ) {
					return (
						<>
							<MenuGroup>
								<MenuItem
									icon={ chevronLeft }
									onClick={ () => switchStep( false ) }
								>
									{ __( 'Back' ) }
								</MenuItem>
							</MenuGroup>
							<SubmenuTypeMenuGroup
								ref={ stepFocusRef }
								onChoose={ ( type ) =>
									runTask( () => {
										if ( type === 'label-only' ) {
											setIsAddingLabelOnly( true );
										} else {
											insertItem(
												type === 'page'
													? createPageSubmenuBlock()
													: createCustomLinkSubmenuBlock()
											);
										}
									} )()
								}
							/>
						</>
					);
				}

				return (
					<>
						<MenuGroup>
							{ canInsertLink && (
								<MenuItem
									icon={ page }
									onClick={ runTask( () =>
										insertItem( createPageLinkBlock() )
									) }
								>
									{ __( 'Add existing page' ) }
								</MenuItem>
							) }
							{ canInsertLink && (
								<MenuItem
									icon={ link }
									onClick={ runTask( () =>
										insertItem( createCustomLinkBlock() )
									) }
								>
									{ __( 'Custom link' ) }
								</MenuItem>
							) }
							{ canInsertSubmenu && (
								<MenuItem
									ref={ stepFocusRef }
									icon={ addSubmenu }
									aria-haspopup="menu"
									onClick={ () => switchStep( true ) }
								>
									{ __( 'Submenu' ) }
								</MenuItem>
							) }
						</MenuGroup>
						<MenuGroup>
							<MenuItem
								icon={ postCategories }
								onClick={ runTask( () =>
									setIsAddingMore( true )
								) }
							>
								{ __( 'More…' ) }
							</MenuItem>
						</MenuGroup>
					</>
				);
			} }
		</DropdownMenu>
	);

	return (
		<div
			ref={ cellRef }
			className="navigation-menu-appender"
			data-navigation-menu-appender-for={
				isSubmenu ? clientId : undefined
			}
			style={ {
				// Line the button up with the items it adds to. The list
				// view's own styles already indent it by one level.
				paddingInlineStart: APPENDER_INDENT * ( nestingLevel - 1 ),
				paddingBlockEnd: 'var(--wpds-dimension-padding-sm, 8px)',
				// An empty submenu's note sits beside its add button, to keep
				// the row compact.
				...( isEmptySubmenu && {
					display: 'flex',
					alignItems: 'center',
				} ),
			} }
		>
			{ ! isSubmenu && (
				<NavigationMenuListStyles navigationClientId={ clientId } />
			) }
			{ dropdown }
			{ isEmptySubmenu && (
				<p
					className="navigation-menu-appender__empty"
					style={ EMPTY_STATE_STYLE }
				>
					{ __( 'This submenu is empty.' ) }
				</p>
			) }
			{ isAddingLabelOnly && (
				<SubmenuLabelPopover
					anchor={ toggleElement }
					onSubmit={ saveLabelOnly }
					onCancel={ () => {
						setIsAddingLabelOnly( false );
						focusToggle();
					} }
				/>
			) }
			{ submenuRequestRow && submenuRequest?.step === 'type' && (
				// The same choice, and the same look, as the add button's
				// "Submenu" option (a `DropdownMenu`, whose styles hang off these
				// classes).
				<WCPopover
					anchor={ submenuRequestRow }
					placement="bottom-end"
					onClose={ cancelSubmenuRequest }
					focusOnMount="firstElement"
					className="components-dropdown-menu__popover components-dropdown__content"
				>
					<NavigableMenu
						role="menu"
						aria-label={ __( 'Create submenu' ) }
						className="components-dropdown-menu__menu"
					>
						<SubmenuTypeMenuGroup
							onChoose={ ( type ) => {
								if ( type === 'label-only' ) {
									setSubmenuRequest( {
										...submenuRequest,
										step: 'label',
									} );
								} else {
									finishSubmenuRequest( type );
								}
							} }
						/>
					</NavigableMenu>
				</WCPopover>
			) }
			{ submenuRequestRow && submenuRequest?.step === 'label' && (
				<SubmenuLabelPopover
					anchor={ submenuRequestRow }
					onSubmit={ ( submenuLabel ) =>
						finishSubmenuRequest(
							'label-only',
							escapeHTML( submenuLabel )
						)
					}
					onCancel={ cancelSubmenuRequest }
				/>
			) }
			{ isAddingMore && (
				<BulkAddModal
					rootClientId={ clientId }
					onClose={ () => {
						setIsAddingMore( false );
						focusToggle();
					} }
				/>
			) }
		</div>
	);
}

export default forwardRef( NavigationMenuAppender );
