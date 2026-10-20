import type { ReactNode, RefObject } from 'react';
import { __, _x, isRTL, sprintf } from '@wordpress/i18n';
import {
	Button,
	Slot,
	ToolbarItem,
	__experimentalStyleProvider as StyleProvider,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { createPortal, useEffect, useRef, useState } from '@wordpress/element';
import { useCopyToClipboard } from '@wordpress/compose';
import {
	getBlockSupport,
	getBlockType,
	hasBlockSupport,
	serialize,
} from '@wordpress/blocks';
import {
	alignCenter,
	alignLeft,
	alignRight,
	alignNone,
	moreVertical,
	positionCenter,
	positionLeft,
	positionRight,
	search as searchIcon,
	stretchFullWidth,
	stretchWide,
} from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
import { Menu } from '@wordpress/ui';
import BlockActions from '../../block-actions';
import { BlockLockModal, useBlockLock } from '../../block-lock';
import { BlockRenameModal, useBlockRename } from '../../block-rename';
import { useConvertToGroupButtonProps } from '../../convert-to-group-buttons';
import { useSettings } from '../../use-settings';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';
import { useNotifyCopy } from '../../../utils/use-notify-copy';
import { getFillProps, setOptionsMenuOpen } from './utils';
import type { RichTextControl } from './utils';
import { textToMenuShortcut, useBlockActionShortcuts } from './shortcuts';
import type { MenuShortcut } from './shortcuts';

const EMPTY_OBJECT: Record< string, any > = {};

const TEXT_ALIGNMENTS = [
	{ value: 'left', label: __( 'Left' ), icon: alignLeft },
	{ value: 'center', label: __( 'Center' ), icon: alignCenter },
	{ value: 'right', label: __( 'Right' ), icon: alignRight },
];

/*
 * Block alignments, in the order they show. `none` is the block's normal
 * width; `wide` and `full` need the theme's support.
 */
const BLOCK_ALIGNMENTS = [
	{ value: 'none', label: _x( 'None', 'Alignment option' ), icon: alignNone },
	{ value: 'wide', label: __( 'Wide' ), icon: stretchWide },
	{ value: 'full', label: __( 'Full width' ), icon: stretchFullWidth },
	{ value: 'left', label: __( 'Float left' ), icon: positionLeft },
	{ value: 'center', label: __( 'Center' ), icon: positionCenter },
	{ value: 'right', label: __( 'Float right' ), icon: positionRight },
];

const WIDE_ALIGNMENTS = [ 'wide', 'full' ];

type Option = {
	value: string;
	label: string;
	icon?: any;
	suffix?: string;
};

type RadioControl = {
	options: Option[];
	value?: string;
	onChange: ( value: string ) => void;
};

type BlockDetails = {
	clientId: string;
	isSingle: boolean;
	name: string;
	attributes: Record< string, any >;
	mode?: string;
	themeSupportsWide: boolean;
	parentLayoutType?: string;
	canEdit: boolean;
	isContentOnly: boolean;
};

type SearchSections = {
	textAlign: RadioControl | null;
	blockAlign: RadioControl | null;
	formats: RichTextControl[];
	inserts: RichTextControl[];
	actions: Action[];
};

type Action = {
	id: string;
	label: string;
	path?: string;
	icon?: any;
	suffix?: string;
	keywords?: string[];
	shortcut?: MenuShortcut;
	disabled?: boolean;
	isChecked?: boolean;
	isCopy?: 'copy' | 'cut';
	onSelect?: ( event?: unknown ) => void;
};

/**
 * Reads what the options menu needs to know about the selected blocks.
 *
 * @param clientIds Selected blocks.
 * @return Block details.
 */
function useSelectedBlockDetails( clientIds: string[] ): BlockDetails {
	return useSelect(
		( select ) => {
			const {
				getBlockName,
				getBlockAttributes,
				getBlockRootClientId,
				getBlockMode,
				getSettings,
				canEditBlock,
				getBlockEditingMode,
			} = select( blockEditorStore );
			const [ clientId ] = clientIds;
			const isSingle = clientIds.length === 1;
			const name = getBlockName( clientId ) ?? '';
			const rootClientId = getBlockRootClientId( clientId );
			const parentName = rootClientId
				? getBlockName( rootClientId )
				: null;
			const parentLayoutType = rootClientId
				? ( ( getBlockAttributes( rootClientId ) as any )?.layout
						?.type ??
					(
						getBlockSupport( parentName ?? '', 'layout' ) as
							{ default?: { type?: string } } | undefined
					 )?.default?.type )
				: undefined;
			return {
				clientId,
				isSingle,
				name,
				attributes: getBlockAttributes( clientId ) ?? EMPTY_OBJECT,
				mode: getBlockMode( clientId ),
				themeSupportsWide: !! (
					getSettings() as { alignWide?: boolean }
				 ).alignWide,
				parentLayoutType,
				canEdit: canEditBlock( clientId ),
				isContentOnly:
					getBlockEditingMode( clientId ) === 'contentOnly',
			};
		},
		[ clientIds ]
	);
}

/**
 * Text alignment: the block's `typography.textAlign` support, or the older
 * `textAlign` attribute some blocks still define themselves.
 *
 * @param block Block details.
 * @return The current value and a setter, or null.
 */
function useTextAlignment( block: BlockDetails ): RadioControl | null {
	const { clientId, isSingle, name, attributes, canEdit, isContentOnly } =
		block;
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	// Like the toolbar control it replaces, only in the default editing mode.
	if ( ! isSingle || ! canEdit || isContentOnly || ! name ) {
		return null;
	}
	if ( hasBlockSupport( name, 'typography.textAlign', false ) ) {
		const support = getBlockSupport( name, 'typography.textAlign' );
		const options = TEXT_ALIGNMENTS.filter(
			( { value } ) =>
				support === true ||
				( Array.isArray( support ) && support.includes( value ) )
		);
		return {
			options,
			value: attributes?.style?.typography?.textAlign,
			onChange: ( textAlign: string ) =>
				updateBlockAttributes( clientId, {
					style: {
						...attributes?.style,
						typography: {
							...attributes?.style?.typography,
							textAlign,
						},
					},
				} ),
		};
	}
	if ( getBlockType( name )?.attributes?.textAlign ) {
		return {
			options: TEXT_ALIGNMENTS,
			value: attributes?.textAlign,
			onChange: ( textAlign: string ) =>
				updateBlockAttributes( clientId, { textAlign } ),
		};
	}
	return null;
}

/**
 * Block alignment, with the widths of the theme's content and wide sizes.
 *
 * @param block Block details.
 * @return The current value and a setter, or null.
 */
function useBlockAlignment( block: BlockDetails ): RadioControl | null {
	const {
		clientId,
		isSingle,
		name,
		attributes,
		canEdit,
		themeSupportsWide,
		parentLayoutType,
		isContentOnly,
	} = block;
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const [ contentSize, wideSize ] = useSettings(
		'layout.contentSize',
		'layout.wideSize'
	) as [ string | undefined, string | undefined ];
	if ( ! isSingle || ! canEdit || isContentOnly || ! name ) {
		return null;
	}
	const support = getBlockSupport( name, 'align' ) as
		boolean | string[] | undefined;
	if ( ! support ) {
		return null;
	}
	// Flex and grid parents don't offer alignments to their children.
	if ( parentLayoutType === 'flex' || parentLayoutType === 'grid' ) {
		return null;
	}
	const supportsWide =
		themeSupportsWide && hasBlockSupport( name, 'alignWide', true );
	const options = BLOCK_ALIGNMENTS.filter( ( { value } ) => {
		if ( value === 'none' ) {
			return true;
		}
		if ( WIDE_ALIGNMENTS.includes( value ) && ! supportsWide ) {
			return false;
		}
		return (
			support === true ||
			( Array.isArray( support ) && support.includes( value ) )
		);
	} ).map( ( option ): Option => {
		let suffix: string | undefined;
		if ( option.value === 'none' && contentSize ) {
			suffix = contentSize;
		} else if ( option.value === 'wide' && wideSize ) {
			suffix = wideSize;
		}
		return suffix
			? {
					...option,
					suffix: sprintf(
						/* translators: %s: a width, e.g. 645px. */
						__( 'Max. %s' ),
						suffix
					),
				}
			: option;
	} );
	if ( options.length < 2 ) {
		return null;
	}
	return {
		options,
		value: attributes?.align || 'none',
		onChange: ( value: string ) =>
			updateBlockAttributes( clientId, {
				align: value === 'none' ? undefined : value,
			} ),
	};
}

/**
 * A menu item that copies the blocks to the clipboard when clicked.
 *
 * @param props           Component props.
 * @param props.clientIds Blocks to copy.
 * @param props.eventType `copy`, `cut` or `copyStyles`.
 * @param props.onCopy    Called after copying.
 * @param props.shortcut  Menu shortcut.
 * @param props.label     Item label.
 */
function CopyItem( {
	clientIds,
	eventType,
	onCopy,
	shortcut,
	label,
}: {
	clientIds: string[];
	eventType: 'copy' | 'cut' | 'copyStyles';
	onCopy?: () => void;
	shortcut?: MenuShortcut;
	label: string;
} ) {
	const { getBlocksByClientId } = useSelect( blockEditorStore );
	const { removeBlocks } = useDispatch( blockEditorStore );
	const notifyCopy = useNotifyCopy();
	const ref = useCopyToClipboard(
		() => serialize( getBlocksByClientId( clientIds ) as any ),
		() => {
			if ( eventType === 'cut' ) {
				notifyCopy( eventType, clientIds );
				removeBlocks( clientIds, true );
				return;
			}
			onCopy?.();
			notifyCopy( eventType, clientIds );
		}
	);
	return (
		<Menu.Item ref={ ref as any } shortcut={ shortcut }>
			<Menu.ItemLabel>{ label }</Menu.ItemLabel>
		</Menu.Item>
	);
}

function RadioSubmenu( {
	label,
	icon,
	control,
}: {
	label: string;
	icon?: any;
	control: RadioControl;
} ) {
	const current = control.options.find(
		( option ) => option.value === control.value
	);
	return (
		<Menu.SubmenuRoot>
			<Menu.SubmenuTrigger
				prefix={ icon && <Menu.PrefixIcon icon={ icon } /> }
				suffix={ current?.label ?? control.options[ 0 ]?.label }
			>
				<Menu.ItemLabel>{ label }</Menu.ItemLabel>
			</Menu.SubmenuTrigger>
			<Menu.Popup className="block-editor-block-toolbar-redesign__menu">
				<Menu.RadioGroup
					value={ control.value ?? control.options[ 0 ]?.value }
					onValueChange={ control.onChange }
				>
					{ control.options.map( ( option ) => (
						<Menu.RadioItem
							key={ option.value }
							value={ option.value }
							prefix={
								option.icon && (
									<Menu.PrefixIcon icon={ option.icon } />
								)
							}
							suffix={ option.suffix }
						>
							<Menu.ItemLabel>{ option.label }</Menu.ItemLabel>
						</Menu.RadioItem>
					) ) }
				</Menu.RadioGroup>
			</Menu.Popup>
		</Menu.SubmenuRoot>
	);
}

function FillItems( {
	controls,
	onDone,
}: {
	controls: RichTextControl[];
	onDone?: () => void;
} ) {
	return controls.map( ( control ) => (
		<Menu.Item
			key={ control.title }
			disabled={ control.disabled }
			shortcut={ textToMenuShortcut( control.shortcut ) }
			prefix={ control.icon && <Menu.PrefixIcon icon={ control.icon } /> }
			onClick={ ( event ) => {
				control.onClick?.( event );
				onDone?.();
			} }
		>
			<Menu.ItemLabel>{ control.title }</Menu.ItemLabel>
		</Menu.Item>
	) );
}

/**
 * Reads the rich text controls the selected block's text offers: formats
 * (Bold, Italic, Link, and the rest) and inline inserts (inline image,
 * footnote, math). They're only there while text in the block is selected.
 *
 * @param props          Component props.
 * @param props.children Render function given `{ formats, inserts }`.
 */
function RichTextControls( {
	children,
}: {
	children: ( controls: {
		formats: RichTextControl[];
		inserts: RichTextControl[];
	} ) => ReactNode;
} ) {
	return (
		<Slot name="RichText.ToolbarControls.bold">
			{ ( bold: unknown ) => (
				<Slot name="RichText.ToolbarControls.italic">
					{ ( italic: unknown ) => (
						<Slot name="RichText.ToolbarControls.link">
							{ ( link: unknown ) => (
								<Slot name="RichText.ToolbarControls">
									{ ( rest: unknown ) => (
										<Slot name="RichText.ToolbarControls.insert">
											{ ( inserts: unknown ) =>
												children( {
													formats: [
														...getFillProps( bold ),
														...getFillProps(
															italic
														),
														...getFillProps( link ),
														...getFillProps(
															rest
														).sort( ( a, b ) =>
															a.title.localeCompare(
																b.title
															)
														),
													],
													inserts:
														getFillProps( inserts ),
												} )
											}
										</Slot>
									) }
								</Slot>
							) }
						</Slot>
					) }
				</Slot>
			) }
		</Slot>
	);
}

/**
 * Plugin and other extra menu items, from the `BlockSettingsMenuControls`
 * slot. They're legacy menu items, so they sit in the More menu as they are,
 * outside the search. Where they go long term is an open question.
 *
 * @param props           Component props.
 * @param props.clientIds Selected blocks.
 * @param props.onClose   Closes the menu.
 */
function LegacyMenuItems( {
	clientIds,
	onClose,
}: {
	clientIds: string[];
	onClose: () => void;
} ) {
	const { selectedBlocks, canEdit } = useSelect(
		( select ) => ( {
			selectedBlocks:
				select( blockEditorStore ).getBlockNamesByClientId( clientIds ),
			canEdit: select( blockEditorStore ).canEditBlock( clientIds[ 0 ] ),
		} ),
		[ clientIds ]
	);
	return (
		<StyleProvider document={ document }>
			<div>
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
				/>
				<Slot
					name="__unstableBlockSettingsMenuFirstItem"
					fillProps={ { onClose } }
				/>
			</div>
		</StyleProvider>
	);
}

/**
 * Builds the flat list of things the search can find: every labelled item,
 * with the path that leads to it.
 *
 * @param sections Menu sections.
 * @return Searchable entries.
 */
function getSearchEntries( sections: SearchSections ): Action[] {
	const entries: Action[] = [];
	const { textAlign, blockAlign, formats, inserts, actions } = sections;
	if ( textAlign ) {
		textAlign.options.forEach( ( option ) =>
			entries.push( {
				id: `text-align-${ option.value }`,
				label: option.label,
				path: __( 'Text alignment' ),
				icon: option.icon,
				keywords: [ __( 'Align' ), __( 'Text' ) ],
				onSelect: () => textAlign.onChange( option.value ),
				isChecked: textAlign.value === option.value,
			} )
		);
	}
	if ( blockAlign ) {
		blockAlign.options.forEach( ( option ) =>
			entries.push( {
				id: `block-align-${ option.value }`,
				label: option.label,
				path: __( 'Block alignment' ),
				icon: option.icon,
				suffix: option.suffix,
				keywords: [ __( 'Align' ), __( 'Width' ) ],
				onSelect: () => blockAlign.onChange( option.value ),
				isChecked: blockAlign.value === option.value,
			} )
		);
	}
	formats.forEach( ( control ) =>
		entries.push( {
			id: `format-${ control.title }`,
			label: control.title,
			path: __( 'Format' ),
			icon: control.icon,
			shortcut: textToMenuShortcut( control.shortcut ),
			onSelect: control.onClick,
		} )
	);
	inserts.forEach( ( control ) =>
		entries.push( {
			id: `insert-${ control.title }`,
			label: control.title,
			path: __( 'Insert' ),
			icon: control.icon,
			onSelect: control.onClick,
		} )
	);
	actions.forEach( ( action ) => entries.push( action ) );
	return entries;
}

function matches( entry: Action, query: string ) {
	const haystack = [ entry.label, entry.path, ...( entry.keywords ?? [] ) ]
		.filter( Boolean )
		.join( ' ' )
		.toLocaleLowerCase();
	return query
		.toLocaleLowerCase()
		.split( /\s+/ )
		.filter( Boolean )
		.every( ( word ) => haystack.includes( word ) );
}

function SearchResults( {
	entries,
	query,
}: {
	entries: Action[];
	query: string;
} ) {
	const results = entries.filter( ( entry ) => matches( entry, query ) );
	if ( ! results.length ) {
		return (
			<Menu.Item disabled>
				<Menu.ItemLabel>{ __( 'No results.' ) }</Menu.ItemLabel>
			</Menu.Item>
		);
	}
	return results.map( ( entry ) => (
		<Menu.Item
			key={ entry.id }
			disabled={ entry.disabled }
			shortcut={ entry.shortcut }
			suffix={ entry.suffix }
			onClick={ entry.onSelect }
		>
			<Menu.ItemLabel>
				{ entry.isChecked ? `${ entry.label } ✓` : entry.label }
			</Menu.ItemLabel>
			{ entry.path ? (
				<Menu.ItemDescription>{ entry.path }</Menu.ItemDescription>
			) : null }
		</Menu.Item>
	) );
}

function SearchField( {
	value,
	onChange,
	inputRef,
}: {
	value: string;
	onChange: ( value: string ) => void;
	inputRef: RefObject< HTMLInputElement | null >;
} ) {
	return (
		<div className="block-editor-block-toolbar-redesign__search">
			<span
				className="block-editor-block-toolbar-redesign__search-icon"
				aria-hidden="true"
			>
				<Menu.PrefixIcon icon={ searchIcon } />
			</span>
			<input
				ref={ inputRef }
				type="search"
				className="block-editor-block-toolbar-redesign__search-input"
				placeholder={ __( 'Search' ) }
				aria-label={ __( 'Search block options' ) }
				value={ value }
				onChange={ ( event ) => onChange( event.target.value ) }
				onKeyDown={ ( event ) => {
					// Let the menu handle moving into the results and
					// closing; keep typing to the field, away from the
					// menu's type-to-select.
					if (
						! [
							'ArrowDown',
							'ArrowUp',
							'Escape',
							'Tab',
							'Enter',
						].includes( event.key )
					) {
						event.stopPropagation();
					}
				} }
			/>
		</div>
	);
}

/**
 * The block options menu: one searchable menu with flyouts for everything
 * the block toolbar doesn't keep on top. Every item has a label.
 *
 * @param props           Component props.
 * @param props.clientIds Selected blocks.
 */
export default function OptionsMenu( { clientIds }: { clientIds: string[] } ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const [ query, setQuery ] = useState( '' );
	const [ modal, setModal ] = useState< 'lock' | 'rename' | null >( null );
	const searchRef = useRef< HTMLInputElement >( null );
	// Plugin menu items render here all the time and are moved into the More
	// menu while it's open, so a dialog one of them opens outlives the menu.
	const [ legacyContainer ] = useState( () =>
		typeof document !== 'undefined' ? document.createElement( 'div' ) : null
	);

	const block = useSelectedBlockDetails( clientIds );
	const textAlign = useTextAlignment( block );
	const blockAlign = useBlockAlignment( block );
	const shortcuts = useBlockActionShortcuts();
	const { canLock, isLocked } = useBlockLock( block.clientId );
	const { canRename } = useBlockRename( block.name );
	const { isGroupable, isUngroupable } =
		useConvertToGroupButtonProps( clientIds );
	const { toggleBlockMode } = useDispatch( blockEditorStore );
	const { showViewportModal } = unlock( useDispatch( blockEditorStore ) );
	const isHiddenAnywhere = useSelect(
		( select ) =>
			clientIds.every( ( id: string ) =>
				unlock( select( blockEditorStore ) ).isBlockHiddenAnywhere( id )
			),
		[ clientIds ]
	);
	const [ allowVisibility ] = useSettings( 'blockVisibility.allowEditing' );
	const canToggleVisibility =
		allowVisibility !== false &&
		block.canEdit &&
		! block.isContentOnly &&
		clientIds.every( ( id: string ) => !! id ) &&
		hasBlockSupport( block.name, 'visibility', true );

	useEffect( () => {
		setOptionsMenuOpen( isOpen );
		if ( ! isOpen ) {
			setQuery( '' );
		}
	}, [ isOpen ] );
	useEffect( () => () => setOptionsMenuOpen( false ), [] );

	const close = () => setIsOpen( false );

	return (
		<BlockActions clientIds={ clientIds } __experimentalUpdateSelection>
			{ ( {
				canCopyStyles,
				canDuplicate,
				canInsertBlock,
				canRemove,
				onDuplicate,
				onInsertAfter,
				onInsertBefore,
				onCopy,
				onPasteStyles,
				onGroup,
				onUngroup,
			}: Record< string, any > ) => {
				const moreActions: Action[] = [
					canLock &&
						block.isSingle &&
						block.canEdit &&
						! block.isContentOnly && {
							id: 'lock',
							label: isLocked ? __( 'Unlock' ) : __( 'Lock' ),
							onSelect: () => setModal( 'lock' ),
						},
					canRename &&
						block.isSingle &&
						block.canEdit &&
						! block.isContentOnly && {
							id: 'rename',
							label: __( 'Rename' ),
							shortcut: shortcuts.rename,
							onSelect: () => setModal( 'rename' ),
						},
					canToggleVisibility && {
						id: 'hide',
						label: isHiddenAnywhere ? __( 'Show' ) : __( 'Hide' ),
						shortcut: shortcuts.hide,
						onSelect: () => showViewportModal( clientIds ),
					},
					block.isSingle &&
						block.canEdit &&
						! block.isContentOnly && {
							id: 'html',
							label:
								block.mode === 'visual'
									? __( 'Edit as HTML' )
									: __( 'Edit visually' ),
							onSelect: () => toggleBlockMode( block.clientId ),
						},
				].filter( Boolean ) as Action[];

				const editActions: Action[] = [
					! block.isContentOnly && {
						id: 'copy',
						label: __( 'Copy' ),
						isCopy: 'copy',
						shortcut: shortcuts.copy,
					},
					canRemove &&
						! block.isContentOnly && {
							id: 'cut',
							label: __( 'Cut' ),
							isCopy: 'cut',
							shortcut: shortcuts.cut,
						},
					canDuplicate && {
						id: 'duplicate',
						label: __( 'Duplicate' ),
						shortcut: shortcuts.duplicate,
						onSelect: onDuplicate,
					},
				].filter( Boolean ) as Action[];

				const groupActions: Action[] = [
					isGroupable &&
						! block.isContentOnly && {
							id: 'group',
							label: _x( 'Group', 'verb' ),
							shortcut: shortcuts.group,
							onSelect: onGroup,
						},
					isUngroupable &&
						! block.isContentOnly && {
							id: 'ungroup',
							label: _x(
								'Ungroup',
								'Ungrouping blocks from within a grouping block back into individual blocks within the Editor'
							),
							onSelect: onUngroup,
						},
				].filter( Boolean ) as Action[];

				const insertActions: Action[] = canInsertBlock
					? [
							{
								id: 'insert-before',
								label: __( 'Block before' ),
								shortcut: shortcuts.insertBefore,
								onSelect: onInsertBefore,
							},
							{
								id: 'insert-after',
								label: __( 'Block after' ),
								shortcut: shortcuts.insertAfter,
								onSelect: onInsertAfter,
							},
						]
					: [];

				const showStyles =
					canCopyStyles && ! block.isContentOnly && block.canEdit;

				const renderAction = ( action: Action ) =>
					action.isCopy ? (
						<CopyItem
							key={ action.id }
							clientIds={ clientIds }
							eventType={ action.isCopy }
							onCopy={ onCopy }
							shortcut={ action.shortcut }
							label={ action.label }
						/>
					) : (
						<Menu.Item
							key={ action.id }
							shortcut={ action.shortcut }
							onClick={ action.onSelect }
						>
							<Menu.ItemLabel>{ action.label }</Menu.ItemLabel>
						</Menu.Item>
					);

				const renderMenu = ( {
					formats,
					inserts,
				}: {
					formats: RichTextControl[];
					inserts: RichTextControl[];
				} ) => {
					const searchEntries = getSearchEntries( {
						textAlign,
						blockAlign,
						formats,
						inserts,
						actions: [
							...( showStyles
								? [
										{
											id: 'paste-styles',
											label: __( 'Paste styles' ),
											path: __( 'Styles' ),
											onSelect: onPasteStyles,
										},
									]
								: [] ),
							...insertActions.map( ( action ) => ( {
								...action,
								path: __( 'Insert' ),
							} ) ),
							// Copy and Cut need the click itself to reach
							// the clipboard, so they're left out of search.
							...editActions.filter(
								( action ) => ! action.isCopy
							),
							...groupActions,
							...moreActions.map( ( action ) => ( {
								...action,
								path: __( 'More' ),
							} ) ),
						],
					} );

					if ( query.trim() ) {
						return (
							<SearchResults
								entries={ searchEntries }
								query={ query }
							/>
						);
					}

					const hasAlign = !! textAlign || !! blockAlign;

					return (
						<>
							{ hasAlign && (
								<Menu.Group>
									<Menu.GroupLabel>
										{ __( 'Align' ) }
									</Menu.GroupLabel>
									{ textAlign && (
										<RadioSubmenu
											label={ __( 'Text' ) }
											icon={
												TEXT_ALIGNMENTS.find(
													( { value } ) =>
														value ===
														( textAlign.value ??
															( isRTL()
																? 'right'
																: 'left' ) )
												)?.icon
											}
											control={ textAlign }
										/>
									) }
									{ blockAlign && (
										<RadioSubmenu
											label={ __( 'Block' ) }
											icon={
												BLOCK_ALIGNMENTS.find(
													( { value } ) =>
														value ===
														blockAlign.value
												)?.icon
											}
											control={ blockAlign }
										/>
									) }
								</Menu.Group>
							) }
							{ hasAlign && <Menu.Separator /> }
							<Menu.Group>
								{ block.isSingle && (
									<Menu.SubmenuRoot>
										<Menu.SubmenuTrigger>
											<Menu.ItemLabel>
												{ __( 'Format' ) }
											</Menu.ItemLabel>
										</Menu.SubmenuTrigger>
										<Menu.Popup className="block-editor-block-toolbar-redesign__menu">
											{ formats.length ? (
												<FillItems
													controls={ formats }
												/>
											) : (
												<Menu.Item disabled>
													<Menu.ItemLabel>
														{ __(
															'Select some text to format it.'
														) }
													</Menu.ItemLabel>
												</Menu.Item>
											) }
										</Menu.Popup>
									</Menu.SubmenuRoot>
								) }
								{ showStyles && (
									<Menu.SubmenuRoot>
										<Menu.SubmenuTrigger>
											<Menu.ItemLabel>
												{ __( 'Styles' ) }
											</Menu.ItemLabel>
										</Menu.SubmenuTrigger>
										<Menu.Popup className="block-editor-block-toolbar-redesign__menu">
											<CopyItem
												clientIds={ clientIds }
												eventType="copyStyles"
												onCopy={ onCopy }
												label={ __( 'Copy styles' ) }
											/>
											<Menu.Item
												onClick={ onPasteStyles }
												shortcut={
													shortcuts.pasteStyles
												}
											>
												<Menu.ItemLabel>
													{ __( 'Paste styles' ) }
												</Menu.ItemLabel>
											</Menu.Item>
										</Menu.Popup>
									</Menu.SubmenuRoot>
								) }
								{ ( !! inserts.length ||
									!! insertActions.length ) && (
									<Menu.SubmenuRoot>
										<Menu.SubmenuTrigger>
											<Menu.ItemLabel>
												{ __( 'Insert' ) }
											</Menu.ItemLabel>
										</Menu.SubmenuTrigger>
										<Menu.Popup className="block-editor-block-toolbar-redesign__menu">
											{ !! inserts.length && (
												<Menu.Group>
													<FillItems
														controls={ inserts }
													/>
												</Menu.Group>
											) }
											{ !! inserts.length &&
												!! insertActions.length && (
													<Menu.Separator />
												) }
											{ insertActions.map(
												renderAction
											) }
										</Menu.Popup>
									</Menu.SubmenuRoot>
								) }
							</Menu.Group>
							{ !! editActions.length && <Menu.Separator /> }
							{ !! editActions.length && (
								<Menu.Group>
									{ editActions.map( renderAction ) }
								</Menu.Group>
							) }
							{ !! groupActions.length && <Menu.Separator /> }
							{ groupActions.map( renderAction ) }
							<Menu.Separator />
							<Menu.SubmenuRoot>
								<Menu.SubmenuTrigger>
									<Menu.ItemLabel>
										{ __( 'More' ) }
									</Menu.ItemLabel>
								</Menu.SubmenuTrigger>
								<Menu.Popup className="block-editor-block-toolbar-redesign__menu">
									{ moreActions.map( renderAction ) }
									<div
										className="block-editor-block-toolbar-redesign__legacy-items"
										ref={ ( node ) => {
											if ( node && legacyContainer ) {
												node.appendChild(
													legacyContainer
												);
											}
										} }
									/>
								</Menu.Popup>
							</Menu.SubmenuRoot>
						</>
					);
				};

				return (
					<>
						<Menu.Root open={ isOpen } onOpenChange={ setIsOpen }>
							<ToolbarItem>
								{ ( itemProps ) => (
									<Menu.Trigger
										render={
											<Button
												{ ...itemProps }
												__next40pxDefaultSize
												icon={ moreVertical }
												label={ __( 'Options' ) }
												showTooltip
											/>
										}
									/>
								) }
							</ToolbarItem>
							<Menu.Popup
								className="block-editor-block-toolbar-redesign__menu block-editor-block-toolbar-redesign__options"
								positioner={
									<Menu.Positioner
										side="bottom"
										align="start"
									/>
								}
								onKeyDownCapture={ ( event ) => {
									// Type anywhere in the menu to search.
									const input = searchRef.current;
									if (
										input &&
										event.target !== input &&
										event.key.length === 1 &&
										! event.metaKey &&
										! event.ctrlKey &&
										! event.altKey &&
										event.key !== ' '
									) {
										event.stopPropagation();
										input.focus();
									}
								} }
							>
								<SearchField
									value={ query }
									onChange={ setQuery }
									inputRef={ searchRef }
								/>
								<RichTextControls>
									{ renderMenu }
								</RichTextControls>
							</Menu.Popup>
						</Menu.Root>
						{ legacyContainer &&
							createPortal(
								<LegacyMenuItems
									clientIds={ clientIds }
									onClose={ close }
								/>,
								legacyContainer
							) }
						{ modal === 'lock' && (
							<BlockLockModal
								clientId={ block.clientId }
								onClose={ () => setModal( null ) }
							/>
						) }
						{ modal === 'rename' && (
							<BlockRenameModal
								clientId={ block.clientId }
								onClose={ () => setModal( null ) }
							/>
						) }
					</>
				);
			} }
		</BlockActions>
	);
}
