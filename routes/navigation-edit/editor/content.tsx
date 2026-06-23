/**
 * WordPress dependencies
 */
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
	// @ts-expect-error - No type declarations available for @wordpress/block-editor
} from '@wordpress/block-editor';
import {
	Button,
	DropdownMenu,
	MenuGroup,
	MenuItem,
	Modal,
	Popover,
	TextControl,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
// @ts-expect-error - No type declarations available for @wordpress/blocks
import { createBlock } from '@wordpress/blocks';
import {
	createInterpolateElement,
	type ComponentType,
	type Ref,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { Link } from '@wordpress/route';
import { unlock } from '@wordpress/routes-lock-unlock';
import {
	addSubmenu as addSubmenuIcon,
	chevronLeft,
	link as linkIcon,
	navigation as navigationIcon,
	page,
	postCategories,
	plus,
	update as syncIcon,
} from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { EmptyState, Stack } from '@wordpress/ui';

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
	content?:
		| string
		| {
				raw?: string;
				rendered?: string;
		  };
	blocks?: Block[];
};

type SubmenuParentMode = 'page' | 'custom';
type ClientId = string | null | undefined;

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
	clientId: ClientId;
	descriptionId: string;
	blockCount?: number;
	ref?: Ref< HTMLButtonElement >;
	setInsertedBlock: ( block: Block | null ) => void;
	onAddExistingPage: (
		parentClientId: ClientId,
		setInsertedBlock: ( block: Block | null ) => void
	) => void;
	onAddCustomLink: (
		parentClientId: ClientId,
		setInsertedBlock: ( block: Block | null ) => void
	) => void;
	onAddSubmenu: (
		parentClientId: ClientId,
		setInsertedBlock: ( block: Block | null ) => void,
		mode?: SubmenuParentMode
	) => void;
	onAddLabelOnlySubmenu: ( parentClientId: ClientId ) => void;
	onAddMenuItems: ( parentClientId: ClientId ) => void;
	isEmptyBranch?: boolean;
} & Record< string, unknown >;

type PageRecord = {
	id: number;
	title: {
		rendered: string;
	};
	link: string;
	type: string;
	parent?: number;
};

type BlockLibraryPrivateApis = {
	convertToNavigationLinks?: (
		pages?: PageRecord[],
		parentPageID?: number | null
	) => Block[];
	NavigationLinkControls?: ComponentType< NavigationLinkControlsProps >;
	NavigationLinkUI?: ComponentType< NavigationLinkUIProps >;
};

type NavigationTreeAdditionalContentProps = NavigationLinkUIProps & {
	NavigationLinkUI?: ComponentType< NavigationLinkUIProps >;
	onInsertedSubmenuComplete: ( block: Block | null | undefined ) => void;
};
type PopoverAnchor =
	| Element
	| {
			getBoundingClientRect: () => DOMRect;
			ownerDocument?: Document;
	  };

const PAGE_QUERY = {
	context: 'edit',
	order: 'asc',
	orderby: 'menu_order',
	per_page: -1,
	status: 'publish',
};

export function isAutoMenuBlockList( blocks: Block[] | undefined ) {
	return blocks?.length === 1 && blocks[ 0 ]?.name === 'core/page-list';
}

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

function getBlockListRootClientId( clientId: ClientId ) {
	return clientId || '';
}

function getListViewBlockPopoverAnchorElement(
	listViewElement: HTMLElement,
	clientId: string
) {
	const rowElement = listViewElement.querySelector(
		`[role="row"][data-block="${ clientId }"]`
	);

	if ( ! rowElement ) {
		return null;
	}

	/*
	 * List View rows span the whole tree grid. Anchoring the label-only
	 * submenu popover to the row places it at the far edge of the panel,
	 * which visually detaches it from the submenu the user just inserted.
	 * Prefer the visible block content control so the popover stays attached
	 * to the submenu item itself.
	 */
	return (
		rowElement.querySelector( '.block-editor-list-view-block-contents' ) ||
		rowElement.querySelector(
			'.block-editor-list-view-block__contents-container'
		) ||
		rowElement
	);
}

function getLabelOnlySubmenuPopoverAnchor(
	listViewElement: HTMLElement,
	clientId: string
): PopoverAnchor | null {
	const anchorElement = getListViewBlockPopoverAnchorElement(
		listViewElement,
		clientId
	);

	if ( ! anchorElement ) {
		return null;
	}

	/*
	 * The List View item can still be wider than the visible submenu label.
	 * Use a virtual anchor whose left edge matches the item but whose width is
	 * constrained, so the label-only popover opens below the submenu row
	 * instead of being pushed toward the preview canvas.
	 */
	return {
		ownerDocument: anchorElement.ownerDocument,
		getBoundingClientRect() {
			const rect = anchorElement.getBoundingClientRect();
			return new DOMRect(
				rect.left,
				rect.top,
				Math.min( rect.width, 240 ),
				rect.height
			);
		},
	};
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
			!! clientId &&
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
									{ __( 'Submenu' ) }
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

function AutoMenuState( {
	isCustomizeDisabled,
	onCustomize,
}: {
	isCustomizeDisabled: boolean;
	onCustomize: () => void;
} ) {
	return (
		<EmptyState.Root className="navigation-edit-editor__auto-menu">
			<EmptyState.Icon icon={ syncIcon } />
			<EmptyState.Title>{ __( 'Auto-menu' ) }</EmptyState.Title>
			<EmptyState.Description>
				{ createInterpolateElement(
					__(
						'This menu is kept in sync with your current <pagesLink>Pages</pagesLink>. When you add, rename, or remove pages, this menu updates automatically.'
					),
					{
						// @ts-ignore Children are injected by createInterpolateElement.
						pagesLink: <Link to="/types/page/list/all" />,
					}
				) }
			</EmptyState.Description>
			<EmptyState.Actions>
				<Button
					variant="primary"
					onClick={ onCustomize }
					disabled={ isCustomizeDisabled }
					accessibleWhenDisabled
					__next40pxDefaultSize
				>
					{ __( 'Customize' ) }
				</Button>
			</EmptyState.Actions>
		</EmptyState.Root>
	);
}

export default function NavigationMenuContent( {
	isAddingItems,
	navigationMenu,
	onCloseAddMenuItems,
	onAutoMenuChange,
}: {
	isAddingItems: boolean;
	navigationMenu: NavigationMenuRecord;
	onCloseAddMenuItems: () => void;
	onAutoMenuChange: ( isAutoMenu: boolean ) => void;
} ) {
	const registry = useRegistry();
	const { hasMenuItems, navigationBlocks } = useSelect( ( select ) => {
		const { getBlocks, getBlockCount } = select( blockEditorStore );

		return {
			hasMenuItems: getBlockCount( null ) > 0,
			navigationBlocks: getBlocks( null ),
		};
	}, [] );
	const isAutoMenu = isAutoMenuBlockList( navigationBlocks );
	const { pages, hasResolvedPages } = useSelect( ( select ) => {
		const store = select( coreStore ) as {
			getEntityRecords: (
				kind: string,
				name: string,
				query: typeof PAGE_QUERY
			) => PageRecord[] | undefined;
			hasFinishedResolution: (
				selectorName: string,
				args: unknown[]
			) => boolean;
		};
		const selectorArgs = [ 'postType', 'page', PAGE_QUERY ];

		return {
			pages: store.getEntityRecords( 'postType', 'page', PAGE_QUERY ),
			hasResolvedPages: store.hasFinishedResolution(
				'getEntityRecords',
				selectorArgs
			),
		};
	}, [] );
	const {
		removeBlock,
		replaceInnerBlocks,
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
	const [ isCustomizeAutoMenuModalOpen, setIsCustomizeAutoMenuModalOpen ] =
		useState( false );
	const [ addMenuItemsTargetClientId, setAddMenuItemsTargetClientId ] =
		useState< ClientId >( undefined );
	const [ anchorElement, setAnchorElement ] = useState< Element | null >(
		null
	);
	const [ labelOnlyAnchorElement, setLabelOnlyAnchorElement ] =
		useState< PopoverAnchor | null >( null );
	const listViewRef = useRef< HTMLDivElement >( null );

	useEffect( () => {
		onAutoMenuChange( isAutoMenu );
	}, [ isAutoMenu, onAutoMenuChange ] );

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

		const element = getLabelOnlySubmenuPopoverAnchor(
			listViewRef.current,
			labelOnlySubmenuClientId
		);
		setLabelOnlyAnchorElement( element ?? null );
	}, [ labelOnlySubmenuClientId, navigationBlocks ] );

	const replaceBlockList = useCallback(
		( parentClientId: ClientId, blocks: Block[], isPersistent = true ) => {
			const rootClientId = getBlockListRootClientId( parentClientId );

			if ( ! isPersistent ) {
				__unstableMarkNextChangeAsNotPersistent();
			}

			replaceInnerBlocks( rootClientId, blocks, false );
		},
		[ __unstableMarkNextChangeAsNotPersistent, replaceInnerBlocks ]
	);

	const appendBlocksToBlockList = useCallback(
		( parentClientId: ClientId, blocks: Block[] ) => {
			if ( ! blocks.length ) {
				return;
			}

			/*
			 * This route edits the saved `wp_navigation` block list directly
			 * rather than rendering a synthetic `core/navigation` wrapper.
			 * Using `insertBlock(s)` would re-run normal inserter checks, where
			 * Navigation Link/Submenu are rejected because their block metadata
			 * says they require a `core/navigation` parent. The saved entity
			 * shape is still the same list of navigation item blocks, so append
			 * by replacing the relevant root/submenu block list instead.
			 */
			const rootClientId = getBlockListRootClientId( parentClientId );
			const currentBlocks = registry
				.select( blockEditorStore )
				.getBlocks( rootClientId ) as Block[];

			replaceBlockList( parentClientId, [ ...currentBlocks, ...blocks ] );
		},
		[ registry, replaceBlockList ]
	);

	const replaceBlockInBlockList = useCallback(
		( clientId: string, replacementBlock: Block, isPersistent = true ) => {
			const blockEditor = registry.select( blockEditorStore );
			const rootClientId = blockEditor.getBlockRootClientId(
				clientId
			) as ClientId;
			const currentBlocks = blockEditor.getBlocks(
				getBlockListRootClientId( rootClientId )
			) as Block[];

			replaceBlockList(
				rootClientId,
				currentBlocks.map( ( block ) =>
					block.clientId === clientId ? replacementBlock : block
				),
				isPersistent
			);
		},
		[ registry, replaceBlockList ]
	);

	const offCanvasOnselect = useCallback(
		( block: Block ) => {
			if (
				block.name === 'core/navigation-link' &&
				! block.attributes.url
			) {
				replaceBlockInBlockList(
					block.clientId,
					createBlock(
						'core/navigation-link',
						block.attributes
					) as Block,
					false
				);
			}
		},
		[ replaceBlockInBlockList ]
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
	const {
		convertToNavigationLinks,
		NavigationLinkControls,
		NavigationLinkUI,
	} = getBlockLibraryPrivateApis();
	const customizeAutoMenu = useCallback( () => {
		if ( ! convertToNavigationLinks || ! hasResolvedPages ) {
			return;
		}

		const pageListBlock = navigationBlocks[ 0 ];
		const parentPageID =
			typeof pageListBlock?.attributes?.parentPageID === 'number'
				? pageListBlock.attributes.parentPageID
				: null;

		replaceBlockList(
			null,
			convertToNavigationLinks( pages ?? [], parentPageID )
		);
		setIsCustomizeAutoMenuModalOpen( false );
	}, [
		convertToNavigationLinks,
		hasResolvedPages,
		navigationBlocks,
		pages,
		replaceBlockList,
	] );
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

			appendBlocksToBlockList( addMenuItemsTargetClientId, blocks );
		},
		[ addMenuItemsTargetClientId, appendBlocksToBlockList ]
	);

	const openAddMenuItemsModal = useCallback( ( parentClientId: ClientId ) => {
		setAddMenuItemsTargetClientId( parentClientId || null );
	}, [] );

	const closeAddMenuItemsModal = useCallback( () => {
		setAddMenuItemsTargetClientId( undefined );
		if ( isAddingItems ) {
			onCloseAddMenuItems();
		}
	}, [ isAddingItems, onCloseAddMenuItems ] );

	const addExistingPage = useCallback(
		(
			parentClientId: ClientId,
			setInsertedBlock: ( block: Block | null ) => void
		) => {
			const block = createBlock( 'core/navigation-link', {
				kind: 'post-type',
				type: 'page',
			} );

			appendBlocksToBlockList( parentClientId, [ block as Block ] );
			setEditingBlockClientId( null );
			setInsertedBlock( block as Block );
		},
		[ appendBlocksToBlockList ]
	);

	const addCustomLink = useCallback(
		(
			parentClientId: ClientId,
			setInsertedBlock: ( block: Block | null ) => void
		) => {
			const block = createBlock( 'core/navigation-link' );

			appendBlocksToBlockList( parentClientId, [ block as Block ] );
			setEditingBlockClientId( null );
			setInsertedBlock( block as Block );
		},
		[ appendBlocksToBlockList ]
	);

	const addSubmenu = useCallback(
		(
			parentClientId: ClientId,
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

			appendBlocksToBlockList( parentClientId, [ block as Block ] );
			setEditingBlockClientId( null );
			setInsertedBlock( block as Block );
		},
		[ appendBlocksToBlockList ]
	);

	const addLabelOnlySubmenu = useCallback(
		( parentClientId: ClientId ) => {
			const block = createBlock( 'core/navigation-submenu' );

			appendBlocksToBlockList( parentClientId, [ block as Block ] );
			setEditingBlockClientId( null );
			setLabelOnlySubmenuClientId( block.clientId );
			setLabelOnlySubmenuLabel( '' );
		},
		[ appendBlocksToBlockList ]
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

	let content;
	if ( isAutoMenu ) {
		content = (
			<AutoMenuState
				isCustomizeDisabled={
					! hasResolvedPages || ! convertToNavigationLinks
				}
				onCustomize={ () => setIsCustomizeAutoMenuModalOpen( true ) }
			/>
		);
	} else if ( hasMenuItems ) {
		content = (
			<div
				ref={ listViewRef }
				className="navigation-edit-editor__list-view"
			>
				<PrivateListView
					rootClientId={ null }
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
		);
	} else {
		content = (
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
						onClick={ () => openAddMenuItemsModal( null ) }
						__next40pxDefaultSize
					>
						{ __( 'Add menu items' ) }
					</Button>
				</EmptyState.Actions>
			</EmptyState.Root>
		);
	}

	return (
		<>
			{ content }
			{ isCustomizeAutoMenuModalOpen && (
				<Modal
					title={ __( 'Customize this menu?' ) }
					overlayClassName="navigation-edit-editor__customize-auto-menu-modal"
					onRequestClose={ () =>
						setIsCustomizeAutoMenuModalOpen( false )
					}
				>
					<p>
						{ __(
							"Your menu won't be automatically kept in sync with your pages anymore, but you will be able to customize it manually."
						) }
					</p>
					<Stack direction="row" justify="flex-end" gap="sm">
						<Button
							variant="tertiary"
							onClick={ () =>
								setIsCustomizeAutoMenuModalOpen( false )
							}
							__next40pxDefaultSize
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							variant="primary"
							onClick={ customizeAutoMenu }
							disabled={
								! hasResolvedPages || ! convertToNavigationLinks
							}
							accessibleWhenDisabled
							__next40pxDefaultSize
						>
							{ __( 'Customize menu' ) }
						</Button>
					</Stack>
				</Modal>
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
					placement="bottom-start"
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
							label={ __( 'Submenu label' ) }
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
			{ ( isAddingItems || addMenuItemsTargetClientId !== undefined ) && (
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
