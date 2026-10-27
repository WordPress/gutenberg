import { serialize, getBlockType, hasBlockSupport } from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import {
	MenuGroup,
	Slot,
	ToolbarButton,
	ToolbarItem,
	Button,
} from '@wordpress/components';
import type { IconType } from '@wordpress/components';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
	Menu,
} from '@wordpress/ui';
import { useCopyToClipboard } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import {
	group as groupIcon,
	lock as lockIcon,
	pencil,
	search as searchIcon,
	seen,
	settings,
	ungroup as ungroupIcon,
	unlock as unlockIcon,
	unseen,
	Icon,
} from '@wordpress/icons';
import type { ReactNode, RefObject } from 'react';
import SubmenuPopup, {
	SUBMENU_TRIGGER_PROPS,
	useFlyoutAim,
} from './submenu-popup';
import BlockActions from '../../block-actions';
import { BlockLockModal, useBlockLock } from '../../block-lock';
import { BlockRenameModal, useBlockRename } from '../../block-rename';
import { useConvertToGroupButtonProps } from '../../convert-to-group-buttons';
import { RichTextToolbarControlsFills } from '../../rich-text/format-toolbar';
import { useSettings } from '../../use-settings';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';
import { useNotifyCopy } from '../../../utils/use-notify-copy';
import { useBlockElement } from '../../block-list/use-block-props/use-block-refs';
import { groupBlocks } from '../../../utils/group-blocks';
import {
	getMenuShortcutFromDisplay,
	matchesSearch,
	useMenuShortcuts,
} from './utils';
import type { MenuShortcut } from './utils';
import type { ToolbarControlFill } from '../../rich-text/types';
import type {
	BlockOptionsMenuChoice,
	BlockOptionsMenuItemProps,
} from './options-menu-item';

const SHORTCUT_NAMES = {
	copy: 'core/block-editor/copy',
	cut: 'core/block-editor/cut',
	duplicate: 'core/block-editor/duplicate',
	insertBefore: 'core/block-editor/insert-before',
	insertAfter: 'core/block-editor/insert-after',
	pasteStyles: 'core/block-editor/paste-styles',
	group: 'core/block-editor/group',
	rename: 'core/block-editor/rename',
	toggleVisibility: 'core/block-editor/toggle-block-visibility',
};

const FORMAT_FILL_NAMES = [
	'RichText.ToolbarControls.bold',
	'RichText.ToolbarControls.italic',
];

const INSERT_FILL_NAMES = [
	'RichText.ToolbarControls.image',
	'RichText.ToolbarControls.footnote',
	'RichText.ToolbarControls.math',
];

/**
 * A menu item that runs an action.
 */
interface ActionEntry {
	key: string;
	label: string;
	icon?: IconType;
	shortcut?: MenuShortcut;
	disabled?: boolean;
	onClick?: () => void;
	/**
	 * Returns the text the item copies to the clipboard, if it copies.
	 */
	getCopyText?: () => string;
	/**
	 * Called once the item copied its text.
	 */
	onCopied?: () => void;
	/**
	 * Opens a dialog, so assistive technology is told.
	 */
	hasDialog?: boolean;
}

/**
 * A menu item that opens a submenu of choices, showing the current one.
 */
interface ChoiceEntry {
	key: string;
	label: string;
	icon?: IconType;
	choices: BlockOptionsMenuChoice[];
	value?: string;
	onChange: ( value: string ) => void;
}

/**
 * The icon before a menu item label, if any. Items without one leave the
 * prefix empty, so their labels line up with the icons of their siblings.
 *
 * @param icon The icon.
 * @return The prefix.
 */
function getPrefix( icon?: IconType ) {
	if ( ! icon ) {
		return undefined;
	}
	// The block editor icons are drawn on a 24px grid.
	return <Menu.PrefixIcon icon={ icon as never } size={ 24 } />;
}

function ActionMenuItem( {
	entry,
	suffix,
}: {
	entry: ActionEntry;
	suffix?: string;
} ) {
	// Copying needs the click itself, for the clipboard permission.
	const copyRef = useCopyToClipboard< HTMLDivElement >(
		entry.getCopyText ?? '',
		entry.onCopied
	);
	return (
		<Menu.Item
			ref={ entry.getCopyText ? copyRef : undefined }
			disabled={ entry.disabled }
			onClick={ entry.onClick }
			prefix={ getPrefix( entry.icon ) }
			shortcut={ entry.shortcut }
			suffix={ suffix }
			aria-haspopup={ entry.hasDialog ? 'dialog' : undefined }
		>
			<Menu.ItemLabel>{ entry.label }</Menu.ItemLabel>
		</Menu.Item>
	);
}

function ChoiceSubmenu( { entry }: { entry: ChoiceEntry } ) {
	const current = entry.choices.find(
		( choice ) => choice.value === entry.value
	);
	return (
		<Menu.SubmenuRoot>
			<Menu.SubmenuTrigger
				{ ...SUBMENU_TRIGGER_PROPS }
				prefix={ getPrefix( entry.icon ) }
				suffix={ current?.label }
			>
				<Menu.ItemLabel>{ entry.label }</Menu.ItemLabel>
			</Menu.SubmenuTrigger>
			<SubmenuPopup>
				<Menu.RadioGroup
					value={ entry.value ?? null }
					onValueChange={ ( value ) => entry.onChange( value ) }
					aria-label={ entry.label }
				>
					{ entry.choices.map( ( choice ) => (
						<Menu.RadioItem
							key={ choice.value }
							value={ choice.value }
							prefix={ getPrefix( choice.icon ) }
							suffix={ choice.info }
						>
							<Menu.ItemLabel>{ choice.label }</Menu.ItemLabel>
						</Menu.RadioItem>
					) ) }
				</Menu.RadioGroup>
			</SubmenuPopup>
		</Menu.SubmenuRoot>
	);
}

function ActionsSubmenu( {
	label,
	sections,
	children,
}: {
	label: string;
	sections: ActionEntry[][];
	children?: ReactNode;
} ) {
	const nonEmptySections = sections.filter( ( section ) => section.length );
	if ( ! nonEmptySections.length && ! children ) {
		return null;
	}
	return (
		<Menu.SubmenuRoot>
			<Menu.SubmenuTrigger { ...SUBMENU_TRIGGER_PROPS }>
				<Menu.ItemLabel>{ label }</Menu.ItemLabel>
			</Menu.SubmenuTrigger>
			<SubmenuPopup>
				{ nonEmptySections.map( ( section, index ) => (
					<Menu.Group key={ index }>
						{ index > 0 && <Menu.Separator /> }
						{ section.map( ( entry ) => (
							<ActionMenuItem key={ entry.key } entry={ entry } />
						) ) }
					</Menu.Group>
				) ) }
				{ children }
			</SubmenuPopup>
		</Menu.SubmenuRoot>
	);
}

/**
 * Turns the fills of rich text toolbar slots into menu entries.
 *
 * @param fills            The fills.
 * @param onKeepFocus      Keeps the menu from moving focus when it closes.
 * @param options          Options.
 * @param options.hasIcons Whether to show the icons of the formats.
 * @return The menu entries.
 */
function getFormatEntries(
	fills: ToolbarControlFill[],
	onKeepFocus: () => void,
	{ hasIcons = true }: { hasIcons?: boolean } = {}
): ActionEntry[] {
	return fills.map( ( [ { props } ], index ) => ( {
		key: `${ props.title }-${ index }`,
		label: props.title,
		icon: hasIcons ? ( props.icon as IconType ) : undefined,
		shortcut: getMenuShortcutFromDisplay( props.shortcut ),
		disabled: !! props.disabled,
		onClick: () => {
			// Formats move focus back to the text themselves.
			onKeepFocus();
			// The toolbar buttons are called without an event.
			( props.onClick as ( () => void ) | undefined )?.();
		},
	} ) );
}

/**
 * Turns items added through the slot into menu entries.
 *
 * @param items The items.
 * @param group The group to take.
 * @return The menu entries.
 */
function getSlotEntries(
	items: BlockOptionsMenuItemProps[],
	group: BlockOptionsMenuItemProps[ 'group' ]
): ActionEntry[] {
	return items
		.filter( ( item ) => item.group === group && ! item.choices )
		.map( ( item ) => ( {
			key: item.name,
			label: item.label,
			icon: item.icon,
			shortcut: getMenuShortcutFromDisplay( item.shortcut ),
			disabled: item.disabled,
			onClick: item.onClick,
		} ) );
}

const ITEM_SELECTOR =
	'[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';

/**
 * Lets the arrow keys move between the items of a menu and the legacy
 * `MenuItem` buttons rendered in it, which the menu does not know about.
 *
 * @param containerRef The element holding the legacy items.
 */
function useLegacyItemsNavigation(
	containerRef: RefObject< HTMLDivElement | null >
) {
	useEffect( () => {
		const container = containerRef.current;
		const menu = container?.closest< HTMLElement >( '[role="menu"]' );
		if ( ! container || ! menu ) {
			return;
		}
		const isEnabled = ( element: HTMLElement ) =>
			! element.hasAttribute( 'disabled' ) &&
			element.getAttribute( 'aria-disabled' ) !== 'true';

		function onKeyDown( event: KeyboardEvent ) {
			if (
				! container ||
				! menu ||
				! [ 'ArrowDown', 'ArrowUp', 'Home', 'End' ].includes(
					event.key
				)
			) {
				return;
			}
			const legacyItems = Array.from(
				container.querySelectorAll< HTMLElement >( ITEM_SELECTOR )
			).filter( isEnabled );
			if ( ! legacyItems.length ) {
				return;
			}
			const menuItems = Array.from(
				menu.querySelectorAll< HTMLElement >( ITEM_SELECTOR )
			).filter(
				( element ) =>
					! container.contains( element ) &&
					element.closest( '[role="menu"]' ) === menu &&
					isEnabled( element )
			);
			const activeElement = menu.ownerDocument
				.activeElement as HTMLElement | null;
			const legacyIndex = activeElement
				? legacyItems.indexOf( activeElement )
				: -1;
			const firstLegacy = legacyItems[ 0 ];
			const lastLegacy = legacyItems[ legacyItems.length - 1 ];
			let next: HTMLElement | undefined;
			if ( legacyIndex !== -1 ) {
				next = {
					ArrowDown: legacyItems[ legacyIndex + 1 ] ?? menuItems[ 0 ],
					ArrowUp:
						legacyItems[ legacyIndex - 1 ] ??
						menuItems[ menuItems.length - 1 ],
					Home: menuItems[ 0 ] ?? firstLegacy,
					End: lastLegacy,
				}[ event.key ];
			} else if (
				event.key === 'End' ||
				( event.key === 'ArrowDown' &&
					activeElement === menuItems[ menuItems.length - 1 ] )
			) {
				next = event.key === 'End' ? lastLegacy : firstLegacy;
			} else if (
				event.key === 'ArrowUp' &&
				activeElement === menuItems[ 0 ]
			) {
				next = lastLegacy;
			}
			if ( next ) {
				event.preventDefault();
				event.stopPropagation();
				next.focus();
			}
		}

		menu.addEventListener( 'keydown', onKeyDown, true );
		return () => menu.removeEventListener( 'keydown', onKeyDown, true );
	} );
}

function LegacyMenuItems( { children }: { children: ReactNode } ) {
	const containerRef = useRef< HTMLDivElement >( null );
	useLegacyItemsNavigation( containerRef );
	return (
		<>
			<Menu.Separator />
			<div
				ref={ containerRef }
				className="block-editor-block-toolbar__legacy-menu-items"
			>
				<MenuGroup>{ children }</MenuGroup>
			</div>
		</>
	);
}

/**
 * Renders the legacy `BlockSettingsMenuControls` fills, from plugins and
 * other packages, so the actions they add stay available.
 *
 * @param props           Component props.
 * @param props.clientIds The client IDs of the blocks.
 * @param props.onClose   Closes the menu.
 */
function LegacyMenuControls( {
	clientIds,
	onClose,
}: {
	clientIds: string[];
	onClose: () => void;
} ) {
	const { selectedBlocks, canEdit } = useSelect(
		( select ) => {
			const { getBlockNamesByClientId, canEditBlock } =
				select( blockEditorStore );
			return {
				selectedBlocks: getBlockNamesByClientId( clientIds ),
				canEdit: canEditBlock( clientIds[ 0 ] ),
			};
		},
		[ clientIds ]
	);
	return (
		<Slot
			name="BlockSettingsMenuControls"
			fillProps={ {
				onClose,
				count: clientIds.length,
				firstBlockClientId: clientIds[ 0 ],
				canEdit,
				selectedBlocks,
				selectedClientIds: clientIds,
			} }
		>
			{ ( fills ) =>
				( fills as unknown[] ).length > 0 && (
					<LegacyMenuItems>{ fills }</LegacyMenuItems>
				)
			}
		</Slot>
	);
}

function SearchField( {
	value,
	onChange,
}: {
	value: string;
	onChange: ( value: string ) => void;
} ) {
	const inputRef = useRef< HTMLInputElement >( null );

	// Search as soon as the menu opens. The menu moves focus itself while
	// it opens, so wait for that.
	useEffect( () => {
		const view = inputRef.current?.ownerDocument.defaultView;
		const frame = view?.requestAnimationFrame( () =>
			inputRef.current?.focus()
		);
		return () => {
			if ( frame !== undefined ) {
				view?.cancelAnimationFrame( frame );
			}
		};
	}, [] );

	return (
		<div className="block-editor-block-toolbar__options-search">
			<Icon icon={ searchIcon } size={ 24 } />
			<input
				ref={ inputRef }
				type="search"
				value={ value }
				aria-label={ __( 'Search block options' ) }
				autoComplete="off"
				onChange={ ( event ) => onChange( event.target.value ) }
				onKeyDown={ ( event ) => {
					// Typing searches; leave typeahead and other keys to the
					// menu, so arrow keys move into the items.
					if (
						event.key.length === 1 ||
						event.key === 'Backspace' ||
						event.key === 'Delete' ||
						event.key === 'Home' ||
						event.key === 'End' ||
						event.key === 'ArrowLeft' ||
						event.key === 'ArrowRight'
					) {
						event.stopPropagation();
					}
				} }
			/>
		</div>
	);
}

/**
 * The contents of the options menu. Mounted only while the menu is open, as
 * it renders the rich text format slots that the selection toolbar renders
 * while text is selected.
 *
 * @param props              Component props.
 * @param props.clientIds    The client IDs of the blocks.
 * @param props.items        The items added through the slot.
 * @param props.onClose      Closes the menu.
 * @param props.onOpenModal  Opens one of the modals of the menu.
 * @param props.onKeepFocus  Keeps the menu from moving focus when it closes.
 * @param props.formatFills  The fills of the format slots.
 * @param props.insertFills  The fills of the inserting format slots.
 * @param props.blockActions The actions on the blocks.
 */
function OptionsMenuContent( {
	clientIds,
	items,
	onClose,
	onOpenModal,
	onKeepFocus,
	formatFills,
	insertFills,
	blockActions,
}: {
	clientIds: string[];
	items: BlockOptionsMenuItemProps[];
	onClose: () => void;
	onOpenModal: ( modal: 'lock' | 'rename' ) => void;
	onKeepFocus: () => void;
	formatFills: ToolbarControlFill[];
	insertFills: ToolbarControlFill[];
	blockActions: Parameters<
		Parameters< typeof BlockActions >[ 0 ][ 'children' ]
	>[ 0 ];
} ) {
	const [ search, setSearch ] = useState( '' );
	const shortcuts = useMenuShortcuts( SHORTCUT_NAMES );
	const firstClientId = clientIds[ 0 ];
	const isSingleBlock = clientIds.length === 1;
	const {
		canCopyStyles,
		canDuplicate,
		canInsertBlock,
		canRemove,
		onDuplicate,
		onInsertAfter,
		onInsertBefore,
		onCopy,
		onPasteStyles,
	} = blockActions;

	const {
		isContentOnly,
		isZoomOut,
		canEdit,
		blockMode,
		canEditHTML,
		canToggleVisibility,
		areBlocksHiddenAnywhere,
		blockName,
	} = useSelect(
		( select ) => {
			const {
				getBlockEditingMode,
				getBlockMode,
				getBlock,
				getSettings,
				canEditBlock,
				getBlocksByClientId,
				isBlockHiddenAnywhere,
				isZoomOut: _isZoomOut,
			} = unlock( select( blockEditorStore ) );
			const block = getBlock( firstClientId );
			const blockType = block ? getBlockType( block.name ) : null;
			return {
				isContentOnly:
					getBlockEditingMode( firstClientId ) === 'contentOnly',
				isZoomOut: _isZoomOut(),
				canEdit: canEditBlock( firstClientId ),
				blockMode: getBlockMode( firstClientId ),
				canEditHTML:
					!! blockType &&
					hasBlockSupport( blockType, 'html', true ) &&
					!! getSettings().codeEditingEnabled &&
					!! block?.isValid,
				canToggleVisibility: (
					getBlocksByClientId( clientIds ) as Block[]
				 ).every(
					( selectedBlock ) =>
						!! selectedBlock &&
						hasBlockSupport(
							selectedBlock.name,
							'visibility',
							true
						)
				),
				areBlocksHiddenAnywhere: clientIds.every( ( clientId ) =>
					isBlockHiddenAnywhere( clientId )
				),
				blockName: block?.name,
			};
		},
		[ clientIds, firstClientId ]
	);
	const [ allowVisibility ] = useSettings( 'blockVisibility.allowEditing' );
	const { canLock, isLocked } = useBlockLock( firstClientId );
	const { canRename } = useBlockRename( blockName );
	const {
		isGroupable,
		isUngroupable,
		blocksSelection,
		groupingBlockName,
		onUngroup,
	} = useConvertToGroupButtonProps( clientIds );
	const { getBlocksByClientId } = useSelect( blockEditorStore );
	const { replaceBlocks, removeBlocks, toggleBlockMode, showViewportModal } =
		unlock( useDispatch( blockEditorStore ) );
	const notifyCopy = useNotifyCopy();

	const getContent = () =>
		// The blocks to act on exist.
		serialize( getBlocksByClientId( clientIds ) as Block[] );

	// Align, text first.
	const alignEntries: ChoiceEntry[] = items
		.filter( ( item ) => item.group === 'align' && item.choices )
		.sort(
			( a, b ) =>
				Number( b.name === 'text-align' ) -
				Number( a.name === 'text-align' )
		)
		.map( ( item ) => ( {
			key: item.name,
			label: item.label,
			icon: item.icon,
			// Items in the align group come with choices.
			choices: item.choices!,
			value: item.value,
			onChange: ( value ) => item.onChange?.( value ),
		} ) );

	// Format, the fallback for formatting without a text selection.
	const formatEntries = getFormatEntries( formatFills, onKeepFocus );

	// Styles.
	const styleEntries: ActionEntry[] =
		canCopyStyles && ! isContentOnly
			? [
					{
						key: 'copy-styles',
						label: __( 'Copy styles' ),
						getCopyText: getContent,
						onCopied: () => {
							onCopy();
							notifyCopy( 'copyStyles', clientIds );
						},
					},
					...( canEdit
						? [
								{
									key: 'paste-styles',
									label: __( 'Paste styles' ),
									shortcut: shortcuts.pasteStyles,
									onClick: onPasteStyles,
								},
							]
						: [] ),
				]
			: [];

	// Insert.
	const inlineInsertEntries = [
		// Like the other insert items, these go without icons.
		...getFormatEntries( insertFills, onKeepFocus, { hasIcons: false } ),
		...getSlotEntries( items, 'insert' ),
	];
	const blockInsertEntries: ActionEntry[] =
		canInsertBlock && ! isZoomOut
			? [
					{
						key: 'insert-before',
						label: __( 'Block before' ),
						shortcut: shortcuts.insertBefore,
						onClick: onInsertBefore,
					},
					{
						key: 'insert-after',
						label: __( 'Block after' ),
						shortcut: shortcuts.insertAfter,
						onClick: onInsertAfter,
					},
				]
			: [];

	// Clipboard.
	const clipboardEntries: ActionEntry[] = [
		...( ! isContentOnly
			? [
					{
						key: 'copy',
						label: __( 'Copy' ),
						shortcut: shortcuts.copy,
						getCopyText: getContent,
						onCopied: () => {
							onCopy();
							notifyCopy( 'copy', clientIds );
						},
					},
				]
			: [] ),
		...( canRemove && ! isContentOnly
			? [
					{
						key: 'cut',
						label: __( 'Cut' ),
						shortcut: shortcuts.cut,
						getCopyText: getContent,
						onCopied: () => {
							notifyCopy( 'cut', clientIds );
							removeBlocks( clientIds, true );
						},
					},
				]
			: [] ),
		...( canDuplicate
			? [
					{
						key: 'duplicate',
						label: __( 'Duplicate' ),
						shortcut: shortcuts.duplicate,
						onClick: () => {
							onDuplicate();
						},
					},
				]
			: [] ),
	];

	// Group, Create pattern, and actions added through the slot.
	const actionEntries: ActionEntry[] = [
		...( isGroupable && ! isContentOnly
			? [
					{
						key: 'group',
						label: _x( 'Group', 'verb' ),
						icon: groupIcon,
						shortcut: shortcuts.group,
						onClick: () => {
							const newBlocks = groupBlocks(
								blocksSelection,
								// Groupable selections have a grouping block.
								groupingBlockName!
							);
							if ( newBlocks ) {
								replaceBlocks( clientIds, newBlocks );
							}
						},
					},
				]
			: [] ),
		...( isUngroupable && ! isContentOnly
			? [
					{
						key: 'ungroup',
						label: _x(
							'Ungroup',
							'Ungrouping blocks from within a grouping block back into individual blocks within the Editor'
						),
						icon: ungroupIcon,
						onClick: () => {
							let innerBlocks = blocksSelection[ 0 ].innerBlocks;
							if ( ! innerBlocks.length ) {
								return;
							}
							if ( onUngroup ) {
								innerBlocks = onUngroup(
									blocksSelection[ 0 ].attributes,
									blocksSelection[ 0 ].innerBlocks
								);
							}
							replaceBlocks( clientIds, innerBlocks );
						},
					},
				]
			: [] ),
		...getSlotEntries( items, 'actions' ),
	];

	// More.
	const moreEntries: ActionEntry[] = isContentOnly
		? getSlotEntries( items, 'more' )
		: [
				...( canEdit && isSingleBlock && canLock
					? [
							{
								key: 'lock',
								label: isLocked ? __( 'Unlock' ) : __( 'Lock' ),
								icon: isLocked ? unlockIcon : lockIcon,
								hasDialog: true,
								onClick: () => onOpenModal( 'lock' ),
							},
						]
					: [] ),
				...( canEdit && isSingleBlock && canRename
					? [
							{
								key: 'rename',
								label: __( 'Rename' ),
								icon: pencil,
								shortcut: shortcuts.rename,
								hasDialog: true,
								onClick: () => onOpenModal( 'rename' ),
							},
						]
					: [] ),
				...( canEdit && canToggleVisibility && allowVisibility !== false
					? [
							{
								key: 'visibility',
								label: areBlocksHiddenAnywhere
									? __( 'Show' )
									: __( 'Hide' ),
								icon: areBlocksHiddenAnywhere ? seen : unseen,
								shortcut: shortcuts.toggleVisibility,
								hasDialog: true,
								onClick: () => showViewportModal( clientIds ),
							},
						]
					: [] ),
				...( canEdit && isSingleBlock && canEditHTML
					? [
							{
								key: 'html',
								label:
									blockMode === 'visual'
										? __( 'Edit as HTML' )
										: __( 'Edit visually' ),
								onClick: () => toggleBlockMode( firstClientId ),
							},
						]
					: [] ),
				...getSlotEntries( items, 'more' ),
			];

	const normalizedSearch = search.trim().toLocaleLowerCase();
	if ( normalizedSearch ) {
		const results: { entry: ActionEntry; context?: string }[] = (
			[
				...alignEntries.flatMap( ( alignEntry ) =>
					alignEntry.choices.map( ( choice ) => ( {
						entry: {
							key: `${ alignEntry.key }-${ choice.value }`,
							label: choice.label,
							icon: choice.icon,
							onClick: () => alignEntry.onChange( choice.value ),
						},
						context: alignEntry.label,
					} ) )
				),
				...formatEntries.map( ( entry ) => ( {
					entry,
					context: __( 'Format' ),
				} ) ),
				...styleEntries.map( ( entry ) => ( {
					entry,
					context: __( 'Styles' ),
				} ) ),
				...[ ...inlineInsertEntries, ...blockInsertEntries ].map(
					( entry ) => ( { entry, context: __( 'Insert' ) } )
				),
				...clipboardEntries.map( ( entry ) => ( { entry } ) ),
				...actionEntries.map( ( entry ) => ( { entry } ) ),
				...moreEntries.map( ( entry ) => ( {
					entry,
					context: __( 'More' ),
				} ) ),
			] as { entry: ActionEntry; context?: string }[]
		 ).filter(
			( { entry, context } ) =>
				matchesSearch( entry.label, normalizedSearch ) ||
				( !! context && matchesSearch( context, normalizedSearch ) )
		);

		return (
			<>
				<SearchField value={ search } onChange={ setSearch } />
				{ results.map( ( { entry, context } ) => (
					<ActionMenuItem
						key={ entry.key }
						entry={ entry }
						suffix={ context }
					/>
				) ) }
				{ ! results.length && (
					<p className="block-editor-block-toolbar__options-no-results">
						{ __( 'No results found.' ) }
					</p>
				) }
			</>
		);
	}

	return (
		<>
			<SearchField value={ search } onChange={ setSearch } />
			{ alignEntries.length > 0 && (
				<>
					<Menu.Group>
						<Menu.GroupLabel>
							{ _x( 'Align', 'Block options menu group' ) }
						</Menu.GroupLabel>
						{ alignEntries.map( ( entry ) => (
							<ChoiceSubmenu key={ entry.key } entry={ entry } />
						) ) }
					</Menu.Group>
					<Menu.Separator />
				</>
			) }
			<Menu.Group aria-label={ __( 'Text and insert' ) }>
				<ActionsSubmenu
					label={ __( 'Format' ) }
					sections={ [ formatEntries ] }
				/>
				<ActionsSubmenu
					label={ __( 'Styles' ) }
					sections={ [ styleEntries ] }
				/>
				<ActionsSubmenu
					label={ __( 'Insert' ) }
					sections={ [ inlineInsertEntries, blockInsertEntries ] }
				/>
			</Menu.Group>
			{ clipboardEntries.length > 0 && (
				<>
					<Menu.Separator />
					<Menu.Group aria-label={ __( 'Clipboard' ) }>
						{ clipboardEntries.map( ( entry ) => (
							<ActionMenuItem key={ entry.key } entry={ entry } />
						) ) }
					</Menu.Group>
				</>
			) }
			<Menu.Separator />
			<Menu.Group aria-label={ __( 'Block actions' ) }>
				{ actionEntries.map( ( entry ) => (
					<ActionMenuItem key={ entry.key } entry={ entry } />
				) ) }
				<ActionsSubmenu
					label={ __( 'More' ) }
					sections={ [ moreEntries ] }
				>
					<LegacyMenuControls
						clientIds={ clientIds }
						onClose={ onClose }
					/>
				</ActionsSubmenu>
			</Menu.Group>
		</>
	);
}

/**
 * The options menu of the redesigned block toolbar: one searchable menu for
 * the block tools, with submenus to keep it organized.
 *
 * @param props           Component props.
 * @param props.clientIds The client IDs of the blocks.
 * @param props.items     The items added through the slot.
 */
export default function BlockOptionsMenu( {
	clientIds,
	items,
}: {
	clientIds: string[];
	items: BlockOptionsMenuItemProps[];
} ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const [ modal, setModal ] = useState< 'lock' | 'rename' | null >( null );
	const shouldKeepFocusRef = useRef( false );
	const flyoutAimRef = useFlyoutAim();
	// The rich text with the selection, where formats return focus to.
	const selectionStart = useSelect(
		( select ) => select( blockEditorStore ).getSelectionStart(),
		[]
	);
	const selectionBlockElement = useBlockElement(
		selectionStart?.clientId ?? ''
	);
	const focusRichText = () => {
		const selector = `[data-wp-block-attribute-key="${ selectionStart?.attributeKey }"]`;
		const richText = selectionBlockElement?.matches( selector )
			? selectionBlockElement
			: selectionBlockElement?.querySelector( selector );
		( richText as HTMLElement | null | undefined )?.focus();
	};
	const firstClientId = clientIds[ 0 ];
	const count = clientIds.length;

	// Without blocks, the toolbar shows the menu as a disabled placeholder.
	if ( ! count ) {
		return (
			<ToolbarButton
				className="block-editor-block-toolbar__options-button"
				icon={ settings }
				label={ __( 'Options' ) }
				disabled
				accessibleWhenDisabled
			/>
		);
	}

	return (
		<>
			<Menu.Root
				// Like the other toolbar dropdowns, the menu does not trap
				// focus, so formats can move focus back to the text.
				modal={ false }
				open={ isOpen }
				onOpenChange={ ( nextIsOpen ) => {
					if ( nextIsOpen ) {
						shouldKeepFocusRef.current = false;
					}
					setIsOpen( nextIsOpen );
				} }
				onOpenChangeComplete={ ( nextIsOpen ) => {
					// Formats and inline inserts act on the text, so typing
					// carries on there.
					if ( ! nextIsOpen && shouldKeepFocusRef.current ) {
						focusRichText();
					}
				} }
			>
				<ToolbarItem>
					{ ( toolbarItemProps ) => (
						<Menu.Trigger
							{ ...toolbarItemProps }
							render={
								<Button
									size="compact"
									className="block-editor-block-toolbar__options-button"
									icon={ settings }
									label={
										count > 1
											? sprintf(
													/* translators: %d: number of selected blocks. */
													__(
														'Options for %d blocks'
													),
													count
												)
											: __( 'Options' )
									}
									showTooltip
								/>
							}
						/>
					) }
				</ToolbarItem>
				<Menu.Popup
					ref={ flyoutAimRef }
					className="block-editor-block-toolbar__options-menu"
					width="md"
					finalFocus={ () => ! shouldKeepFocusRef.current }
					positioner={
						<Menu.Positioner
							className="block-editor-block-toolbar__menu-positioner"
							side="bottom"
							align="start"
						/>
					}
				>
					<BlockActions
						clientIds={ clientIds }
						__experimentalUpdateSelection
					>
						{ ( blockActions ) => (
							<RichTextToolbarControlsFills
								names={ FORMAT_FILL_NAMES }
							>
								{ ( formatFills ) => (
									<RichTextToolbarControlsFills
										names={ INSERT_FILL_NAMES }
									>
										{ ( insertFills ) => (
											<OptionsMenuContent
												clientIds={ clientIds }
												items={ items }
												onClose={ () =>
													setIsOpen( false )
												}
												onOpenModal={ setModal }
												onKeepFocus={ () => {
													shouldKeepFocusRef.current = true;
												} }
												formatFills={ formatFills }
												insertFills={ insertFills }
												blockActions={ blockActions }
											/>
										) }
									</RichTextToolbarControlsFills>
								) }
							</RichTextToolbarControlsFills>
						) }
					</BlockActions>
				</Menu.Popup>
			</Menu.Root>
			{ modal === 'lock' && (
				<BlockLockModal
					clientId={ firstClientId }
					onClose={ () => setModal( null ) }
				/>
			) }
			{ modal === 'rename' && (
				<BlockRenameModal
					clientId={ firstClientId }
					onClose={ () => setModal( null ) }
				/>
			) }
		</>
	);
}
