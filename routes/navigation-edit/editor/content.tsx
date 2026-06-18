/**
 * WordPress dependencies
 */
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
	BlockList,
	// @ts-expect-error - No type declarations available for @wordpress/block-editor
} from '@wordpress/block-editor';
import {
	Button,
	DropdownMenu,
	MenuGroup,
	MenuItem,
	Popover,
	TextControl,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
// @ts-expect-error - No type declarations available for @wordpress/blocks
import { createBlock } from '@wordpress/blocks';
import {
	type ComponentType,
	type Ref,
	useCallback,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { unlock } from '@wordpress/routes-lock-unlock';
import {
	addSubmenu as addSubmenuIcon,
	chevronLeft,
	link as linkIcon,
	navigation as navigationIcon,
	page,
	postCategories,
	plus,
} from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { EmptyState } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import LeafMoreMenu from './leaf-more-menu';
import AddMenuItemsModal from '../add-menu-items-modal';

type Block = {
	clientId: string;
	name: string;
	attributes: Record< string, unknown >;
	innerBlocks?: Block[];
};

type NavigationMenuRecord = {
	id: number;
	title?: {
		raw?: string;
		rendered?: string;
	};
	content?: {
		raw?: string;
		rendered?: string;
	};
};

type SubmenuParentMode = 'page' | 'custom';

const { PrivateListView } = unlock( blockEditorPrivateApis );

type NavigationLinkControlsProps = {
	attributes: Record< string, unknown >;
	setAttributes: ( attributes: Record< string, unknown > ) => void;
	clientId: string;
	isContentOnly?: boolean;
};

type NavigationLinkUIProps = {
	block: Block;
	insertedBlock?: Block | null;
	setInsertedBlock: ( block: Block | null ) => void;
	showBlockInserter?: boolean;
	onComplete?: (
		block: Block | null | undefined,
		attributes: Record< string, unknown >
	) => void;
	onCancel?: ( block: Block | null | undefined ) => void;
};

type NavigationTreeAppenderProps = {
	clientId: string;
	descriptionId: string;
	blockCount?: number;
	ref?: Ref< HTMLButtonElement >;
	setInsertedBlock: ( block: Block | null ) => void;
	onAddExistingPage: (
		parentClientId: string,
		setInsertedBlock: ( block: Block | null ) => void
	) => void;
	onAddCustomLink: (
		parentClientId: string,
		setInsertedBlock: ( block: Block | null ) => void
	) => void;
	onAddSubmenu: (
		parentClientId: string,
		setInsertedBlock: ( block: Block | null ) => void,
		mode?: SubmenuParentMode
	) => void;
	onAddLabelOnlySubmenu: ( parentClientId: string ) => void;
	onAddMenuItems: ( parentClientId: string ) => void;
	isEmptyBranch?: boolean;
} & Record< string, unknown >;

type BlockLibraryPrivateApis = {
	NavigationLinkControls?: ComponentType< NavigationLinkControlsProps >;
	NavigationLinkUI?: ComponentType< NavigationLinkUIProps >;
};

type NavigationTreeAdditionalContentProps = NavigationLinkUIProps & {
	NavigationLinkUI?: ComponentType< NavigationLinkUIProps >;
	onInsertedSubmenuComplete: ( block: Block | null | undefined ) => void;
};

function deferUntilDropdownCloses( callback: () => void ) {
	window.requestAnimationFrame( callback );
}

function getBlockLibraryPrivateApis(): BlockLibraryPrivateApis {
	const blockLibrary = (
		window as Window & {
			wp?: {
				blockLibrary?: {
					privateApis?: Parameters< typeof unlock >[ 0 ];
				};
			};
		}
	 ).wp?.blockLibrary;

	if ( ! blockLibrary?.privateApis ) {
		return {};
	}

	return unlock< BlockLibraryPrivateApis >( blockLibrary.privateApis );
}

function NavigationTreeAppender( {
	clientId,
	descriptionId,
	blockCount,
	ref: buttonRef,
	setInsertedBlock,
	onAddExistingPage,
	onAddCustomLink,
	onAddSubmenu,
	onAddLabelOnlySubmenu,
	onAddMenuItems,
	isEmptyBranch,
	...treeGridCellProps
}: NavigationTreeAppenderProps ) {
	const [ isChoosingSubmenuType, setIsChoosingSubmenuType ] =
		useState( false );
	const isSubmenuAppender = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlockName( clientId ) ===
			'core/navigation-submenu',
		[ clientId ]
	);
	const appenderLabel = isSubmenuAppender
		? __( 'Add to submenu' )
		: __( 'Add menu item' );
	const shouldShowEmptySubmenu =
		isEmptyBranch || ( isSubmenuAppender && blockCount === 0 );
	const toggleClassName = [
		typeof treeGridCellProps.className === 'string'
			? treeGridCellProps.className
			: '',
		'block-editor-inserter__toggle',
	]
		.filter( Boolean )
		.join( ' ' );

	const dropdown = (
		<DropdownMenu
			icon={ plus }
			label={ appenderLabel }
			popoverProps={ { placement: 'bottom-start' } }
			onToggle={ ( isOpen: boolean ) => {
				if ( ! isOpen ) {
					setIsChoosingSubmenuType( false );
				}
			} }
			toggleProps={ {
				...treeGridCellProps,
				ref: buttonRef,
				className: toggleClassName,
				__next40pxDefaultSize: true,
				'aria-describedby': descriptionId,
			} }
		>
			{ ( { onClose } ) => (
				<>
					{ isChoosingSubmenuType ? (
						<>
							<MenuGroup>
								<MenuItem
									icon={ chevronLeft }
									onClick={ () =>
										setIsChoosingSubmenuType( false )
									}
								>
									{ __( 'Back' ) }
								</MenuItem>
							</MenuGroup>
							<MenuGroup>
								<MenuItem
									icon={ page }
									onClick={ () => {
										onClose();
										setIsChoosingSubmenuType( false );
										deferUntilDropdownCloses( () =>
											onAddSubmenu(
												clientId,
												setInsertedBlock
											)
										);
									} }
								>
									{ __( 'Existing page' ) }
								</MenuItem>
								<MenuItem
									icon={ linkIcon }
									onClick={ () => {
										onClose();
										setIsChoosingSubmenuType( false );
										deferUntilDropdownCloses( () =>
											onAddSubmenu(
												clientId,
												setInsertedBlock,
												'custom'
											)
										);
									} }
								>
									{ __( 'Custom link' ) }
								</MenuItem>
								<MenuItem
									icon={ addSubmenuIcon }
									onClick={ () => {
										onClose();
										setIsChoosingSubmenuType( false );
										deferUntilDropdownCloses( () =>
											onAddLabelOnlySubmenu( clientId )
										);
									} }
								>
									{ __( 'Label only' ) }
								</MenuItem>
							</MenuGroup>
						</>
					) : (
						<>
							<MenuGroup>
								<MenuItem
									icon={ page }
									onClick={ () => {
										onClose();
										deferUntilDropdownCloses( () =>
											onAddExistingPage(
												clientId,
												setInsertedBlock
											)
										);
									} }
								>
									{ __( 'Add existing page' ) }
								</MenuItem>
								<MenuItem
									icon={ linkIcon }
									onClick={ () => {
										onClose();
										deferUntilDropdownCloses( () =>
											onAddCustomLink(
												clientId,
												setInsertedBlock
											)
										);
									} }
								>
									{ __( 'Custom link' ) }
								</MenuItem>
								<MenuItem
									icon={ addSubmenuIcon }
									onClick={ () =>
										setIsChoosingSubmenuType( true )
									}
								>
									{ __( 'Drop-down' ) }
								</MenuItem>
							</MenuGroup>
							<MenuGroup>
								<MenuItem
									icon={ postCategories }
									onClick={ () => {
										onAddMenuItems( clientId );
										onClose();
									} }
								>
									{ __( 'More…' ) }
								</MenuItem>
							</MenuGroup>
						</>
					) }
				</>
			) }
		</DropdownMenu>
	);

	if ( ! shouldShowEmptySubmenu ) {
		return dropdown;
	}

	return (
		<div className="navigation-edit-editor__empty-submenu">
			<span>{ __( 'This submenu is empty.' ) }</span>
			{ dropdown }
		</div>
	);
}

function NavigationTreeAdditionalContent( {
	block,
	insertedBlock,
	setInsertedBlock,
	NavigationLinkUI,
	onInsertedSubmenuComplete,
}: NavigationTreeAdditionalContentProps ) {
	return (
		<>
			{ NavigationLinkUI && (
				<NavigationLinkUI
					block={ block }
					insertedBlock={ insertedBlock }
					setInsertedBlock={ setInsertedBlock }
					showBlockInserter={ false }
					onComplete={ ( completedBlock ) =>
						onInsertedSubmenuComplete( completedBlock )
					}
				/>
			) }
		</>
	);
}

// Needs to be kept in sync with the query used at packages/block-library/src/page-list/edit.js.
const MAX_PAGE_COUNT = 100;
const PAGES_QUERY = [
	'postType',
	'page',
	{
		per_page: MAX_PAGE_COUNT,
		_fields: [ 'id', 'link', 'menu_order', 'parent', 'title', 'type' ],
		// TODO: When https://core.trac.wordpress.org/ticket/39037 REST API support for multiple orderby
		// values is resolved, update 'orderby' to [ 'menu_order', 'post_title' ] to provide a consistent
		// sort.
		orderby: 'menu_order',
		order: 'asc',
	},
];

export default function NavigationMenuContent( {
	isAddingItems,
	navigationMenu,
	onCloseAddMenuItems,
	rootClientId,
}: {
	isAddingItems: boolean;
	navigationMenu: NavigationMenuRecord;
	onCloseAddMenuItems: () => void;
	rootClientId: string;
} ) {
	const navigationMenuId = navigationMenu.id;
	const savedNavigationContent =
		typeof navigationMenu.content?.raw === 'string'
			? navigationMenu.content.raw
			: '';
	const { hasMenuItems, listViewRootClientId, navigationBlocks, isLoading } =
		useSelect(
			( select ) => {
				const {
					areInnerBlocksControlled,
					getBlocks,
					getBlockName,
					getBlockCount,
					getBlockOrder,
				} = select( blockEditorStore );
				const {
					getEditedEntityRecord,
					hasFinishedResolution,
					isResolving,
				} = select( coreStore );

				const blockClientIds = getBlockOrder( rootClientId );
				const blockCount = getBlockCount( rootClientId );
				const navigationEntityArgs = [
					'postType',
					'wp_navigation',
					navigationMenuId,
				];
				const editedNavigationMenu = getEditedEntityRecord(
					...navigationEntityArgs
				);
				const hasResolvedEditedNavigationMenu = hasFinishedResolution(
					'getEditedEntityRecord',
					navigationEntityArgs
				);
				const editedContent = editedNavigationMenu?.content;
				const editedBlocks = editedNavigationMenu?.blocks;
				const editedContentString =
					typeof editedContent === 'string'
						? editedContent
						: editedContent?.raw;
				const editedMenuHasSavedBlocks =
					( Array.isArray( editedBlocks ) &&
						editedBlocks.length > 0 ) ||
					( typeof editedContentString === 'string' &&
						editedContentString.includes( '<!-- wp:' ) ) ||
					savedNavigationContent.includes( '<!-- wp:' );

				const hasOnlyPageListBlock =
					blockClientIds.length === 1 &&
					getBlockName( blockClientIds[ 0 ] ) === 'core/page-list';
				const pageListHasBlocks =
					hasOnlyPageListBlock &&
					getBlockCount( blockClientIds[ 0 ] ) > 0;

				const isLoadingPages = isResolving(
					'getEntityRecords',
					PAGES_QUERY
				);
				const _listViewRootClientId = pageListHasBlocks
					? blockClientIds[ 0 ]
					: rootClientId;

				return {
					hasMenuItems: getBlockCount( _listViewRootClientId ) > 0,
					listViewRootClientId: _listViewRootClientId,
					navigationBlocks: getBlocks( rootClientId ),
					// This is a small hack to wait for the navigation block
					// to actually load its inner blocks.
					isLoading:
						! hasResolvedEditedNavigationMenu ||
						! areInnerBlocksControlled( rootClientId ) ||
						isLoadingPages ||
						( editedMenuHasSavedBlocks && blockCount === 0 ),
				};
			},
			[ navigationMenuId, rootClientId, savedNavigationContent ]
		);
	const {
		insertBlocks,
		insertBlock,
		removeBlock,
		replaceBlock,
		selectBlock,
		updateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );
	const [ editingBlockClientId, setEditingBlockClientId ] = useState<
		string | null
	>( null );
	const [ labelOnlySubmenuClientId, setLabelOnlySubmenuClientId ] = useState<
		string | null
	>( null );
	const [ labelOnlySubmenuLabel, setLabelOnlySubmenuLabel ] = useState( '' );
	const [ addMenuItemsParentClientId, setAddMenuItemsParentClientId ] =
		useState< string | null >( null );
	const [ anchorElement, setAnchorElement ] = useState< Element | null >(
		null
	);
	const [ labelOnlyAnchorElement, setLabelOnlyAnchorElement ] =
		useState< Element | null >( null );
	const listViewRef = useRef< HTMLDivElement >( null );

	const editingBlockAttributes = useSelect(
		( select ) => {
			if ( ! editingBlockClientId ) {
				return null;
			}

			return select( blockEditorStore ).getBlockAttributes(
				editingBlockClientId
			);
		},
		[ editingBlockClientId ]
	);
	const activeSubmenuClientId = useSelect(
		( select ) => {
			const {
				getSelectedBlockClientIds,
				getBlock,
				getBlockName,
				getBlockParents,
			} = select( blockEditorStore );
			const [ selectedClientId ] = getSelectedBlockClientIds();
			const findSubmenuClientId = ( clientId?: string | null ) => {
				if ( ! clientId ) {
					return null;
				}

				const block = getBlock( clientId );

				if ( block?.name === 'core/navigation-submenu' ) {
					return clientId;
				}

				return (
					getBlockParents( clientId ).find(
						( parentClientId: string ) =>
							getBlockName( parentClientId ) ===
							'core/navigation-submenu'
					) || null
				);
			};

			return (
				findSubmenuClientId( selectedClientId ) ||
				findSubmenuClientId( editingBlockClientId )
			);
		},
		[ editingBlockClientId ]
	);

	useLayoutEffect( () => {
		if ( ! editingBlockClientId || ! listViewRef.current ) {
			setAnchorElement( null );
			return;
		}

		const element = listViewRef.current.querySelector(
			`[data-block="${ editingBlockClientId }"]`
		);
		setAnchorElement( element ?? null );
	}, [ editingBlockClientId, navigationBlocks ] );

	useLayoutEffect( () => {
		if ( ! labelOnlySubmenuClientId || ! listViewRef.current ) {
			setLabelOnlyAnchorElement( null );
			return;
		}

		const element = listViewRef.current.querySelector(
			`[data-block="${ labelOnlySubmenuClientId }"]`
		);
		setLabelOnlyAnchorElement( element ?? null );
	}, [ labelOnlySubmenuClientId, navigationBlocks ] );

	const offCanvasOnselect = useCallback(
		( block: Block ) => {
			if (
				block.name === 'core/navigation-link' &&
				! block.attributes.url
			) {
				__unstableMarkNextChangeAsNotPersistent();
				replaceBlock(
					block.clientId,
					createBlock( 'core/navigation-link', block.attributes )
				);
			}
		},
		[ __unstableMarkNextChangeAsNotPersistent, replaceBlock ]
	);

	const handleSelect = useCallback(
		( block: Block ) => {
			if (
				block.name === 'core/navigation-submenu' ||
				( block.name === 'core/navigation-link' &&
					block.attributes.url )
			) {
				setEditingBlockClientId( block.clientId );
				return;
			}

			setEditingBlockClientId( null );
			offCanvasOnselect( block );
		},
		[ offCanvasOnselect ]
	);
	const { NavigationLinkControls, NavigationLinkUI } =
		getBlockLibraryPrivateApis();
	const selectInsertedSubmenu = useCallback(
		( block: Block | null | undefined ) => {
			if ( block?.name !== 'core/navigation-submenu' ) {
				return;
			}

			setEditingBlockClientId( null );
			selectBlock( block.clientId, null );
		},
		[ selectBlock ]
	);
	const addMenuItemBlocks = useCallback(
		( blocks: Block[] ) => {
			if ( ! blocks.length ) {
				return;
			}

			insertBlocks(
				blocks,
				undefined,
				addMenuItemsParentClientId || rootClientId,
				false
			);
		},
		[ addMenuItemsParentClientId, insertBlocks, rootClientId ]
	);

	const openAddMenuItemsModal = useCallback( ( parentClientId: string ) => {
		setAddMenuItemsParentClientId( parentClientId );
	}, [] );

	const closeAddMenuItemsModal = useCallback( () => {
		setAddMenuItemsParentClientId( null );
		if ( isAddingItems ) {
			onCloseAddMenuItems();
		}
	}, [ isAddingItems, onCloseAddMenuItems ] );

	const addExistingPage = useCallback(
		(
			parentClientId: string,
			setInsertedBlock: ( block: Block | null ) => void
		) => {
			const block = createBlock( 'core/navigation-link', {
				kind: 'post-type',
				type: 'page',
			} );

			insertBlock( block, undefined, parentClientId, false );
			setEditingBlockClientId( null );
			setInsertedBlock( block );
		},
		[ insertBlock ]
	);

	const addCustomLink = useCallback(
		(
			parentClientId: string,
			setInsertedBlock: ( block: Block | null ) => void
		) => {
			const block = createBlock( 'core/navigation-link' );

			insertBlock( block, undefined, parentClientId, false );
			setEditingBlockClientId( null );
			setInsertedBlock( block );
		},
		[ insertBlock ]
	);

	const addSubmenu = useCallback(
		(
			parentClientId: string,
			setInsertedBlock: ( block: Block | null ) => void,
			mode: SubmenuParentMode = 'page'
		) => {
			const block = createBlock(
				'core/navigation-submenu',
				mode === 'page'
					? {
							kind: 'post-type',
							type: 'page',
					  }
					: undefined
			);

			insertBlock( block, undefined, parentClientId, false );
			setEditingBlockClientId( null );
			setInsertedBlock( block );
		},
		[ insertBlock ]
	);

	const addLabelOnlySubmenu = useCallback(
		( parentClientId: string ) => {
			const block = createBlock( 'core/navigation-submenu' );

			insertBlock( block, undefined, parentClientId, false );
			setEditingBlockClientId( null );
			setLabelOnlySubmenuClientId( block.clientId );
			setLabelOnlySubmenuLabel( '' );
		},
		[ insertBlock ]
	);

	const cancelLabelOnlySubmenu = useCallback( () => {
		if ( labelOnlySubmenuClientId ) {
			removeBlock( labelOnlySubmenuClientId, false );
		}
		setLabelOnlySubmenuClientId( null );
		setLabelOnlySubmenuLabel( '' );
	}, [ labelOnlySubmenuClientId, removeBlock ] );

	const saveLabelOnlySubmenu = useCallback( () => {
		const label = labelOnlySubmenuLabel.trim();
		if ( ! label || ! labelOnlySubmenuClientId ) {
			return;
		}

		updateBlockAttributes( labelOnlySubmenuClientId, {
			label,
			url: '#',
		} );
		selectBlock( labelOnlySubmenuClientId, null );
		setLabelOnlySubmenuClientId( null );
		setLabelOnlySubmenuLabel( '' );
	}, [
		labelOnlySubmenuClientId,
		labelOnlySubmenuLabel,
		selectBlock,
		updateBlockAttributes,
	] );

	const renderNavigationTreeAppender = useCallback(
		( props: NavigationTreeAppenderProps ) => (
			<NavigationTreeAppender
				{ ...props }
				onAddExistingPage={ addExistingPage }
				onAddCustomLink={ addCustomLink }
				onAddSubmenu={ addSubmenu }
				onAddLabelOnlySubmenu={ addLabelOnlySubmenu }
				onAddMenuItems={ openAddMenuItemsModal }
			/>
		),
		[
			addCustomLink,
			addExistingPage,
			addLabelOnlySubmenu,
			addSubmenu,
			openAddMenuItemsModal,
		]
	);
	const renderNavigationTreeAdditionalContent = useCallback(
		( props: NavigationLinkUIProps ) => (
			<NavigationTreeAdditionalContent
				{ ...props }
				NavigationLinkUI={ NavigationLinkUI }
				onInsertedSubmenuComplete={ selectInsertedSubmenu }
			/>
		),
		[ NavigationLinkUI, selectInsertedSubmenu ]
	);

	// The hidden block is needed because it makes block edit side effects trigger.
	// For example a navigation page list load its items has an effect on edit to load its items.
	return (
		<>
			{ ! isLoading && (
				<>
					{ hasMenuItems ? (
						<div
							ref={ listViewRef }
							className="navigation-edit-editor__list-view"
						>
							<PrivateListView
								rootClientId={ listViewRootClientId }
								onSelect={ handleSelect }
								blockSettingsMenu={ LeafMoreMenu }
								showAppender
								renderAppender={ renderNavigationTreeAppender }
								appenderParentClientId={ activeSubmenuClientId }
								additionalBlockContent={
									renderNavigationTreeAdditionalContent
								}
								isExpanded
							/>
						</div>
					) : (
						<EmptyState.Root>
							<EmptyState.Icon icon={ navigationIcon } />
							<EmptyState.Title>
								{ __( 'No menu items yet' ) }
							</EmptyState.Title>
							<EmptyState.Description>
								{ __(
									'Add pages, links, or other content to start building this navigation menu.'
								) }
							</EmptyState.Description>
							<EmptyState.Actions>
								<Button
									variant="primary"
									onClick={ () =>
										openAddMenuItemsModal( rootClientId )
									}
									__next40pxDefaultSize
								>
									{ __( 'Add menu items' ) }
								</Button>
							</EmptyState.Actions>
						</EmptyState.Root>
					) }
				</>
			) }
			{ editingBlockClientId &&
				editingBlockAttributes &&
				anchorElement &&
				NavigationLinkControls && (
					<Popover
						anchor={ anchorElement }
						placement="right-start"
						onClose={ () => setEditingBlockClientId( null ) }
						className="navigation-edit-editor__link-controls"
					>
						<div style={ { width: '280px' } }>
							<NavigationLinkControls
								attributes={ editingBlockAttributes }
								setAttributes={ (
									newAttributes: Record< string, unknown >
								) =>
									updateBlockAttributes(
										editingBlockClientId,
										newAttributes
									)
								}
								clientId={ editingBlockClientId }
								isContentOnly
							/>
						</div>
					</Popover>
				) }
			{ labelOnlySubmenuClientId && labelOnlyAnchorElement && (
				<Popover
					anchor={ labelOnlyAnchorElement }
					placement="right-start"
					onClose={ cancelLabelOnlySubmenu }
					className="navigation-edit-editor__label-only-submenu"
				>
					<form
						className="navigation-edit-editor__label-only-submenu-form"
						onSubmit={ ( event ) => {
							event.preventDefault();
							saveLabelOnlySubmenu();
						} }
					>
						<TextControl
							label={ __( 'Drop-down label' ) }
							value={ labelOnlySubmenuLabel }
							onChange={ setLabelOnlySubmenuLabel }
							autoComplete="off"
							__next40pxDefaultSize
						/>
						<div className="navigation-edit-editor__label-only-submenu-actions">
							<Button
								variant="tertiary"
								onClick={ cancelLabelOnlySubmenu }
								__next40pxDefaultSize
							>
								{ __( 'Cancel' ) }
							</Button>
							<Button
								type="submit"
								variant="primary"
								disabled={ ! labelOnlySubmenuLabel.trim() }
								accessibleWhenDisabled
								__next40pxDefaultSize
							>
								{ __( 'Add drop-down' ) }
							</Button>
						</div>
					</form>
				</Popover>
			) }
			<div className="navigation-edit-editor__hidden-blocks">
				<BlockList />
			</div>
			{ ( isAddingItems || addMenuItemsParentClientId ) && (
				<AddMenuItemsModal
					navigationBlocks={ navigationBlocks }
					navigationMenu={ navigationMenu }
					onAddBlocks={ addMenuItemBlocks }
					onClose={ closeAddMenuItemsModal }
				/>
			) }
		</>
	);
}
